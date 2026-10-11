// Three.js r186 - Node System

// global
diagnostic( off, derivative_uniformity );


// structs

struct OutputStruct {
	@location( 0 ) color: vec4<f32>
};
var<private> output : OutputStruct;

// uniforms
@binding( 0 ) @group( 1 ) var nodeUniform3_sampler : sampler;
@binding( 1 ) @group( 1 ) var nodeUniform3 : texture_2d<f32>;
@binding( 3 ) @group( 1 ) var nodeUniform5_sampler : sampler;
@binding( 4 ) @group( 1 ) var nodeUniform5 : texture_2d<f32>;
@binding( 5 ) @group( 1 ) var nodeUniform20_sampler : sampler;
@binding( 6 ) @group( 1 ) var nodeUniform20 : texture_2d<f32>;
@binding( 7 ) @group( 1 ) var nodeUniform33_sampler : sampler_comparison;
@binding( 8 ) @group( 1 ) var nodeUniform33 : texture_depth_2d;

struct objectStruct {
	nodeUniform0 : mat4x4<f32>,
	nodeUniform2 : mat4x4<f32>,
	nodeUniform4 : mat3x3<f32>,
	nodeUniform6 : f32,
	nodeUniform7 : mat4x4<f32>,
	nodeUniform8 : f32,
	nodeUniform9 : f32,
	nodeUniform10 : f32,
	nodeUniform12 : mat3x3<f32>,
	nodeUniform13 : f32,
	nodeUniform14 : vec3<f32>,
	nodeUniform17 : vec3<f32>,
	nodeUniform18 : vec3<f32>,
	nodeUniform19 : f32,
	nodeUniform41 : vec3<f32>,
	nodeUniform42 : vec3<f32>,
	nodeUniform43 : vec3<f32>,
	nodeUniform44 : f32
};
@binding( 2 ) @group( 1 )
var<uniform> object : objectStruct;

struct renderStruct {
	cameraProjectionMatrix : mat4x4<f32>,
	cameraViewMatrix : mat4x4<f32>,
	nodeUniform22 : vec3<f32>,
	nodeUniform23 : vec3<f32>,
	nodeUniform21 : vec3<f32>,
	nodeUniform26 : vec3<f32>,
	nodeUniform29 : vec3<f32>,
	nodeUniform38 : vec3<f32>,
	nodeUniform39 : f32,
	nodeUniform40 : f32,
	nodeUniform24 : vec3<f32>,
	nodeUniform25 : vec3<f32>,
	nodeUniform27 : vec3<f32>,
	nodeUniform28 : vec3<f32>,
	nodeUniform37 : vec3<f32>,
	nodeUniform30 : mat4x4<f32>,
	nodeUniform31 : f32,
	nodeUniform32 : f32,
	nodeUniform36 : f32,
	cameraPosition : vec3<f32>,
	nodeUniform34 : f32,
	nodeUniform35 : vec2<f32>
};
@binding( 0 ) @group( 0 )
var<uniform> render : renderStruct;

// vars
var<private> DiffuseColor : vec4<f32>;
var<private> nodeVar1 : vec4<f32>;
var<private> nodeVar2 : f32;
var<private> nodeVar3 : vec3<f32>;
var<private> nodeVar4 : f32;
var<private> nodeVar5 : f32;
var<private> nodeVar6 : vec2<f32>;
var<private> nodeVar7 : f32;
var<private> nodeVar8 : vec3<f32>;
var<private> nodeVar9 : f32;
var<private> nodeVar10 : f32;
var<private> nodeVar11 : vec2<f32>;
var<private> nodeVar12 : f32;
var<private> nodeVar13 : f32;
var<private> nodeVar14 : f32;
var<private> nodeVar15 : vec3<f32>;
var<private> nodeVar16 : f32;
var<private> Metalness : f32;
var<private> Roughness : f32;
var<private> normalViewGeometry : vec3<f32>;
var<private> nodeVar17 : vec3<f32>;
var<private> SpecularColor : vec3<f32>;
var<private> SpecularColorBlended : vec3<f32>;
var<private> SpecularF90 : f32;
var<private> DiffuseContribution : vec3<f32>;
var<private> EmissiveColor : vec3<f32>;
var<private> nodeVar18 : vec3<f32>;
var<private> nodeVar19 : f32;
var<private> nodeVar20 : f32;
var<private> nodeVar21 : vec2<f32>;
var<private> nodeVar22 : f32;
var<private> NORMAL_normalView : vec3<f32>;
var<private> normalView : vec3<f32>;
var<private> normalWorld : vec3<f32>;
var<private> nodeVar23 : vec3<f32>;
var<private> nodeVar24 : vec3<f32>;
var<private> nodeVar25 : f32;
var<private> nodeVar26 : f32;
var<private> nodeVar27 : f32;
var<private> Output : vec4<f32>;
var<private> positionViewDirection : vec3<f32>;
var<private> nodeVar28 : f32;
var<private> nodeVar29 : vec2<f32>;
var<private> nodeVar30 : f32;
var<private> nodeVar31 : f32;
var<private> nodeVar32 : f32;
var<private> nodeVar33 : f32;
var<private> nodeVar34 : vec3<f32>;
var<private> nodeVar35 : vec3<f32>;
var<private> irradiance : vec3<f32>;
var<private> nodeVar36 : f32;
var<private> nodeVar37 : f32;
var<private> nodeVar38 : f32;
var<private> nodeVar39 : vec3<f32>;
var<private> nodeVar40 : vec3<f32>;
var<private> nodeVar41 : vec3<f32>;
var<private> nodeVar42 : vec4<f32>;
var<private> nodeVar43 : vec4<f32>;
var<private> nodeVar44 : vec3<f32>;
var<private> nodeVar45 : vec3<f32>;
var<private> nodeVar46 : f32;
var<private> nodeVar47 : vec3<f32>;
var<private> nodeVar48 : vec3<f32>;
var<private> directDiffuse : vec3<f32>;
var<private> nodeVar49 : vec3<f32>;
var<private> nodeVar50 : vec3<f32>;
var<private> nodeVar51 : vec3<f32>;
var<private> nodeVar52 : vec3<f32>;
var<private> nodeVar53 : f32;
var<private> nodeVar54 : f32;
var<private> nodeVar55 : f32;
var<private> nodeVar56 : vec3<f32>;
var<private> nodeVar57 : vec3<f32>;
var<private> nodeVar58 : vec3<f32>;
var<private> nodeVar59 : vec3<f32>;
var<private> nodeVar60 : vec3<f32>;
var<private> directSpecular : vec3<f32>;
var<private> nodeVar61 : vec3<f32>;
var<private> nodeVar62 : f32;
var<private> nodeVar63 : f32;
var<private> nodeVar64 : f32;
var<private> nodeVar65 : vec3<f32>;
var<private> nodeVar66 : vec3<f32>;
var<private> nodeVar67 : vec3<f32>;
var<private> nodeVar68 : vec3<f32>;
var<private> nodeVar69 : vec3<f32>;
var<private> nodeVar70 : vec4<f32>;
var<private> nodeVar71 : vec4<f32>;
var<private> nodeVar72 : vec3<f32>;
var<private> nodeVar73 : vec3<f32>;
var<private> nodeVar74 : f32;
var<private> shadowPositionWorld : vec3<f32>;
var<private> nodeVar75 : f32;
var<private> nodeVar76 : vec4<f32>;
var<private> nodeVar77 : vec3<f32>;
var<private> nodeVar78 : vec3<f32>;
var<private> nodeVar79 : f32;
var<private> nodeVar80 : f32;
var<private> nodeVar81 : vec2<f32>;
var<private> nodeVar82 : f32;
var<private> nodeVar83 : vec2<f32>;
var<private> nodeVar84 : f32;
var<private> nodeVar85 : vec2<f32>;
var<private> nodeVar86 : f32;
var<private> nodeVar87 : vec2<f32>;
var<private> nodeVar88 : f32;
var<private> nodeVar89 : vec2<f32>;
var<private> nodeVar90 : f32;
var<private> nodeVar91 : f32;
var<private> nodeVar92 : vec3<f32>;
var<private> nodeVar93 : vec3<f32>;
var<private> nodeVar94 : vec3<f32>;
var<private> nodeVar95 : vec3<f32>;
var<private> nodeVar96 : vec3<f32>;
var<private> nodeVar97 : vec3<f32>;
var<private> nodeVar98 : f32;
var<private> nodeVar99 : f32;
var<private> nodeVar100 : f32;
var<private> nodeVar101 : vec3<f32>;
var<private> nodeVar102 : vec3<f32>;
var<private> nodeVar103 : vec3<f32>;
var<private> nodeVar104 : vec3<f32>;
var<private> nodeVar105 : vec3<f32>;
var<private> nodeVar106 : vec3<f32>;
var<private> nodeVar107 : f32;
var<private> nodeVar108 : f32;
var<private> nodeVar109 : f32;
var<private> nodeVar110 : vec3<f32>;
var<private> nodeVar111 : vec3<f32>;
var<private> nodeVar112 : vec3<f32>;
var<private> nodeVar113 : vec3<f32>;
var<private> nodeVar114 : vec3<f32>;
var<private> nodeVar115 : vec3<f32>;
var<private> nodeVar116 : f32;
var<private> nodeVar117 : f32;
var<private> nodeVar118 : f32;
var<private> nodeVar119 : f32;
var<private> nodeVar120 : f32;
var<private> nodeVar121 : vec3<f32>;
var<private> nodeVar122 : vec3<f32>;
var<private> nodeVar123 : vec3<f32>;
var<private> nodeVar124 : vec3<f32>;
var<private> nodeVar125 : vec3<f32>;
var<private> nodeVar126 : vec3<f32>;
var<private> nodeVar127 : vec3<f32>;
var<private> nodeVar128 : f32;
var<private> nodeVar129 : f32;
var<private> nodeVar130 : f32;
var<private> nodeVar131 : vec3<f32>;
var<private> nodeVar132 : vec3<f32>;
var<private> nodeVar133 : vec3<f32>;
var<private> nodeVar134 : vec3<f32>;
var<private> nodeVar135 : vec3<f32>;
var<private> nodeVar136 : vec3<f32>;
var<private> nodeVar137 : f32;
var<private> nodeVar138 : f32;
var<private> nodeVar139 : f32;
var<private> nodeVar140 : vec3<f32>;
var<private> nodeVar141 : vec3<f32>;
var<private> nodeVar142 : vec3<f32>;
var<private> nodeVar143 : vec3<f32>;
var<private> nodeVar144 : vec3<f32>;
var<private> nodeVar145 : vec3<f32>;
var<private> nodeVar146 : vec3<f32>;
var<private> nodeVar147 : f32;
var<private> nodeVar148 : vec3<f32>;
var<private> nodeVar149 : vec3<f32>;
var<private> nodeVar150 : vec3<f32>;
var<private> nodeVar151 : vec3<f32>;
var<private> nodeVar152 : vec3<f32>;
var<private> nodeVar153 : vec3<f32>;
var<private> nodeVar154 : vec3<f32>;
var<private> nodeVar155 : f32;
var<private> nodeVar156 : f32;
var<private> nodeVar157 : f32;
var<private> nodeVar158 : vec3<f32>;
var<private> nodeVar159 : vec3<f32>;
var<private> nodeVar160 : vec3<f32>;
var<private> nodeVar161 : vec3<f32>;
var<private> nodeVar162 : vec3<f32>;
var<private> nodeVar163 : vec3<f32>;
var<private> nodeVar164 : vec3<f32>;
var<private> nodeVar165 : vec3<f32>;
var<private> nodeVar166 : vec3<f32>;
var<private> nodeVar167 : vec3<f32>;
var<private> nodeVar168 : vec3<f32>;
var<private> nodeVar169 : vec3<f32>;
var<private> nodeVar170 : vec3<f32>;
var<private> indirectDiffuse : vec3<f32>;
var<private> nodeVar171 : vec3<f32>;
var<private> singleScatteringDielectric : vec3<f32>;
var<private> multiScatteringDielectric : vec3<f32>;
var<private> singleScatteringMetallic : vec3<f32>;
var<private> multiScatteringMetallic : vec3<f32>;
var<private> nodeVar172 : vec3<f32>;
var<private> nodeVar173 : f32;
var<private> nodeVar174 : vec3<f32>;
var<private> nodeVar175 : vec3<f32>;
var<private> nodeVar176 : vec3<f32>;
var<private> nodeVar177 : vec3<f32>;
var<private> nodeVar178 : vec3<f32>;
var<private> nodeVar179 : vec3<f32>;
var<private> nodeVar180 : vec3<f32>;
var<private> nodeVar181 : f32;
var<private> nodeVar182 : f32;
var<private> nodeVar183 : f32;
var<private> nodeVar184 : vec3<f32>;
var<private> nodeVar185 : vec3<f32>;
var<private> nodeVar186 : vec3<f32>;
var<private> nodeVar187 : vec3<f32>;
var<private> nodeVar188 : vec3<f32>;
var<private> nodeVar189 : vec3<f32>;
var<private> nodeVar190 : vec3<f32>;
var<private> nodeVar191 : f32;
var<private> nodeVar192 : vec3<f32>;
var<private> nodeVar193 : vec3<f32>;
var<private> nodeVar194 : vec3<f32>;
var<private> nodeVar195 : vec3<f32>;
var<private> nodeVar196 : vec3<f32>;
var<private> nodeVar197 : vec3<f32>;
var<private> nodeVar198 : vec3<f32>;
var<private> nodeVar199 : f32;
var<private> nodeVar200 : f32;
var<private> nodeVar201 : f32;
var<private> nodeVar202 : vec3<f32>;
var<private> nodeVar203 : vec3<f32>;
var<private> nodeVar204 : vec3<f32>;
var<private> nodeVar205 : vec3<f32>;
var<private> nodeVar206 : vec3<f32>;
var<private> nodeVar207 : vec3<f32>;
var<private> radiance : vec3<f32>;
var<private> nodeVar208 : vec3<f32>;
var<private> nodeVar209 : vec3<f32>;
var<private> nodeVar210 : vec3<f32>;
var<private> iblIrradiance : vec3<f32>;
var<private> nodeVar211 : vec3<f32>;
var<private> nodeVar212 : vec3<f32>;
var<private> nodeVar213 : vec3<f32>;
var<private> nodeVar214 : vec3<f32>;
var<private> nodeVar215 : vec3<f32>;
var<private> nodeVar216 : vec3<f32>;
var<private> nodeVar217 : vec3<f32>;
var<private> nodeVar218 : vec3<f32>;
var<private> nodeVar219 : vec3<f32>;
var<private> nodeVar220 : vec3<f32>;
var<private> indirectSpecular : vec3<f32>;
var<private> nodeVar221 : vec3<f32>;
var<private> nodeVar222 : vec3<f32>;
var<private> ambientOcclusion : f32;
var<private> nodeVar223 : vec3<f32>;
var<private> nodeVar224 : f32;
var<private> nodeVar225 : f32;
var<private> nodeVar226 : f32;
var<private> nodeVar227 : f32;
var<private> nodeVar228 : f32;
var<private> nodeVar229 : f32;
var<private> nodeVar230 : f32;
var<private> nodeVar231 : f32;
var<private> nodeVar232 : f32;
var<private> nodeVar233 : f32;
var<private> nodeVar234 : f32;
var<private> nodeVar235 : vec3<f32>;
var<private> totalDiffuse : vec3<f32>;
var<private> nodeVar236 : vec3<f32>;
var<private> totalSpecular : vec3<f32>;
var<private> nodeVar237 : vec3<f32>;
var<private> outgoingLight : vec3<f32>;
var<private> nodeVar238 : vec3<f32>;
var<private> nodeVar239 : f32;
var<private> nodeVar240 : vec4<f32>;

// codes
fn tsl_mod_float( x : f32, y : f32 ) -> f32 { return x - y * floor( x / y ); }
fn V_GGX_SmithCorrelated ( alpha : f32, dotNL : f32, dotNV : f32 ) -> f32 {

	var nodeVar0 : f32;

	nodeVar0 = ( alpha * alpha );

	return ( 0.5 / max( ( ( dotNL * sqrt( ( nodeVar0 + ( ( 1.0 - nodeVar0 ) * ( dotNV * dotNV ) ) ) ) ) + ( dotNV * sqrt( ( nodeVar0 + ( ( 1.0 - nodeVar0 ) * ( dotNL * dotNL ) ) ) ) ) ), 0.000001 ) );

}


fn D_GGX ( alpha : f32, dotNH : f32 ) -> f32 {

	var nodeVar0 : f32;
	var nodeVar1 : f32;

	nodeVar0 = ( alpha * alpha );
	nodeVar1 = ( 1.0 - ( ( dotNH * dotNH ) * ( 1.0 - nodeVar0 ) ) );

	return ( ( nodeVar0 / ( nodeVar1 * nodeVar1 ) ) * 0.3183098861837907 );

}


fn interleavedGradientNoise ( position : vec2<f32> ) -> f32 {

	


	return fract( ( 52.9829189 * fract( dot( position, vec2<f32>( 0.06711056, 0.00583715 ) ) ) ) );

}


fn vogelDiskSample ( sampleIndex : i32, samplesCount : i32, phi : f32 ) -> vec2<f32> {

	var nodeVar0 : f32;

	nodeVar0 = ( ( f32( sampleIndex ) * 2.399963229728653 ) + phi );

	return ( vec2<f32>( cos( nodeVar0 ), sin( nodeVar0 ) ) * vec2<f32>( sqrt( ( ( f32( sampleIndex ) + 0.5 ) / f32( samplesCount ) ) ) ) );

}




@fragment
fn main( @location( 0 ) v_positionView : vec3<f32>,
	@location( 1 ) v_positionWorld : vec3<f32>,
	@location( 2 ) v_normalViewGeometry : vec3<f32>,
	@location( 3 ) v_positionViewDirection : vec3<f32>,
	@location( 4 ) nodeVarying7 : vec2<f32>,
	@builtin( position ) fragCoord : vec4<f32> ) -> OutputStruct {

	// flow
	// code

	nodeVar1 = textureSample( nodeUniform3, nodeUniform3_sampler, ( object.nodeUniform4 * vec3<f32>( nodeVarying7, 1.0 ) ).xy );
	nodeVar2 = dot( ( nodeVar1.xyz * vec3<f32>( 1.0, 1.0, 1.0 ) ), vec3<f32>( 0.2126, 0.7152, 0.0722 ) );
	nodeVar3 = fract( ( vec3<f32>( ( nodeVarying7 * vec2<f32>( 22.0 ) ), 0.37 ) / vec3<f32>( 8.0 ) ) );
	nodeVar4 = ( nodeVar3.z * 64.0 );
	nodeVar5 = floor( nodeVar4 );
	nodeVar6 = textureSample( nodeUniform5, nodeUniform5_sampler, ( ( ( ( vec2<f32>( tsl_mod_float( nodeVar5, 8.0 ), floor( ( nodeVar5 / 8.0 ) ) ) * vec2<f32>( 66.0 ) ) + ( nodeVar3.xy * vec2<f32>( 64.0 ) ) ) + vec2<f32>( 1.5 ) ) / vec2<f32>( 528.0 ) ) ).xy;
	nodeVar7 = mix( -0.11, 1.01, object.nodeUniform6 );
	nodeVar8 = fract( ( ( v_positionWorld * vec3<f32>( 4.2 ) ) / vec3<f32>( 8.0 ) ) );
	nodeVar9 = ( nodeVar8.z * 64.0 );
	nodeVar10 = floor( nodeVar9 );
	nodeVar11 = textureSample( nodeUniform5, nodeUniform5_sampler, ( ( ( ( vec2<f32>( tsl_mod_float( nodeVar10, 8.0 ), floor( ( nodeVar10 / 8.0 ) ) ) * vec2<f32>( 66.0 ) ) + ( nodeVar8.xy * vec2<f32>( 64.0 ) ) ) + vec2<f32>( 1.5 ) ) / vec2<f32>( 528.0 ) ) ).xy;
	nodeVar12 = clamp( ( ( mix( nodeVar11.x, nodeVar11.y, ( nodeVar9 - nodeVar10 ) ) * 0.9 ) + 0.5 ), 0.0, 1.0 );
	nodeVar13 = ( 1.0 - smoothstep( nodeVar7, ( nodeVar7 + 0.1 ), nodeVar12 ) );
	nodeVar14 = ( nodeVar13 * nodeVar13 );
	nodeVar15 = mix( ( mix( ( ( vec3<f32>( 0.1499597898006365, 0.16826940017946088, 0.16202937562896222 ) * vec3<f32>( ( ( nodeVar2 * 1.6 ) + 0.45 ) ) ) * vec3<f32>( 3.4 ) ), ( ( vec3<f32>( 0.04231141061442144, 0.061246054224174035, 0.08021982030622662 ) * vec3<f32>( ( nodeVar2 + 0.4 ) ) ) * vec3<f32>( 3.4 ) ), ( smoothstep( -0.35, 0.6, mix( nodeVar6.x, nodeVar6.y, ( nodeVar4 - nodeVar5 ) ) ) * 0.5 ) ) * vec3<f32>( ( 1.0 - ( clamp( ( ( 0.0 + ( 1.0 - smoothstep( 0.014000000000000002, 0.04000000000000001, length( ( nodeVarying7 - vec2<f32>( 0.139, 0.252 ) ) ) ) ) ) + ( 1.0 - smoothstep( 0.014000000000000002, 0.04000000000000001, length( ( nodeVarying7 - vec2<f32>( 0.231, 0.252 ) ) ) ) ) ), 0.0, 1.0 ) * 0.7 ) ) ) ), vec3<f32>( 0.007499032040460618, 0.005605391621829108, 0.004776953478513362 ), ( nodeVar14 * 0.9 ) );
	DiffuseColor = vec4<f32>( nodeVar15, 1.0 );

	if ( ( nodeVar12 > nodeVar7 ) ) {

		nodeVar16 = 1.0;

	} else {

		nodeVar16 = 0.0;

	}

	DiffuseColor.w = ( DiffuseColor.w * nodeVar16 );

	if ( ( DiffuseColor.w <= object.nodeUniform8 ) ) {

		discard;
		

	}

	DiffuseColor.w = 1.0;
	Metalness = object.nodeUniform9;
	normalViewGeometry = normalize( v_normalViewGeometry );
	nodeVar17 = max( abs( dpdx( normalViewGeometry ) ), abs( - dpdy( normalViewGeometry ) ) );
	Roughness = min( ( max( object.nodeUniform10, 0.0525 ) + max( max( nodeVar17.x, nodeVar17.y ), nodeVar17.z ) ), 1.0 );
	SpecularColor = vec3<f32>( 0.04, 0.04, 0.04 );
	SpecularColorBlended = mix( vec3<f32>( 0.04, 0.04, 0.04 ), DiffuseColor.xyz, Metalness );
	SpecularF90 = 1.0;
	DiffuseContribution = ( DiffuseColor.xyz * vec3<f32>( ( 1.0 - object.nodeUniform9 ) ) );
	nodeVar18 = fract( ( vec3<f32>( ( nodeVarying7 * vec2<f32>( 30.0 ) ), 0.37 ) / vec3<f32>( 8.0 ) ) );
	nodeVar19 = ( nodeVar18.z * 64.0 );
	nodeVar20 = floor( nodeVar19 );
	nodeVar21 = textureSample( nodeUniform5, nodeUniform5_sampler, ( ( ( ( vec2<f32>( tsl_mod_float( nodeVar20, 8.0 ), floor( ( nodeVar20 / 8.0 ) ) ) * vec2<f32>( 66.0 ) ) + ( nodeVar18.xy * vec2<f32>( 64.0 ) ) ) + vec2<f32>( 1.5 ) ) / vec2<f32>( 528.0 ) ) ).xy;

	if ( ( object.nodeUniform6 > 0.0 ) ) {

		nodeVar22 = 3.2;

	} else {

		nodeVar22 = 0.0;

	}

	NORMAL_normalView = normalViewGeometry;
	normalView = NORMAL_normalView;
	normalWorld = normalize( ( vec4<f32>( normalView, 0.0 ) * render.cameraViewMatrix ).xyz );
	nodeVar23 = normalize( normalWorld );
	nodeVar24 = normalize( ( render.cameraPosition - v_positionWorld ) );
	nodeVar25 = pow( ( 1.0 - clamp( dot( nodeVar23, nodeVar24 ), 0.0, 1.0 ) ), 3.0 );
	nodeVar26 = smoothstep( -0.35, 0.55, dot( nodeVar23, object.nodeUniform17 ) );
	nodeVar27 = smoothstep( -0.15, 0.85, ( - dot( nodeVar24, object.nodeUniform17 ) ) );
	EmissiveColor = ( ( ( ( ( ( mix( vec3<f32>( 0.34670405634441115, 0.6866853124288864, 1.0 ), vec3<f32>( 1.0, 0.10224173307914941, 0.0069954101845983935 ), object.nodeUniform13 ) * vec3<f32>( clamp( ( ( 0.0 + ( 1.0 - smoothstep( 0.0043749999999999995, 0.0125, length( ( nodeVarying7 - vec2<f32>( 0.139, 0.252 ) ) ) ) ) ) + ( 1.0 - smoothstep( 0.0043749999999999995, 0.0125, length( ( nodeVarying7 - vec2<f32>( 0.231, 0.252 ) ) ) ) ) ), 0.0, 1.0 ) ) ) * vec3<f32>( 1.0 ) ) * vec3<f32>( 1.6 ) ) + ( ( ( vec3<f32>( 1.0, 0.10224173307914941, 0.0069954101845983935 ) * vec3<f32>( object.nodeUniform13 ) ) * vec3<f32>( ( 1.0 - smoothstep( 0.0, 0.035, abs( mix( nodeVar21.x, nodeVar21.y, ( nodeVar19 - nodeVar20 ) ) ) ) ) ) ) * vec3<f32>( 0.6 ) ) ) + ( ( vec3<f32>( 1.0, 0.10224173307914941, 0.0069954101845983935 ) * vec3<f32>( smoothstep( 0.35, 1.0, nodeVar13 ) ) ) * vec3<f32>( nodeVar22 ) ) ) + ( mix( vec3<f32>( 0.0, 0.0, 0.0 ), ( ( ( ( ( object.nodeUniform14 * vec3<f32>( nodeVar25 ) ) * vec3<f32>( nodeVar26 ) ) * vec3<f32>( ( ( nodeVar27 * 1.38 ) + 0.12 ) ) ) + ( ( ( object.nodeUniform18 * vec3<f32>( nodeVar25 ) ) * vec3<f32>( ( 1.0 - ( nodeVar26 * nodeVar27 ) ) ) ) * vec3<f32>( 0.18 ) ) ) + ( ( ( nodeVar15 * vec3<f32>( 0.07 ) ) * vec3<f32>( ( 1.0 - ( smoothstep( 0.0, 0.5, dot( nodeVar15, vec3<f32>( 0.299, 0.587, 0.114 ) ) ) * 0.6 ) ) ) ) + vec3<f32>( 0.006, 0.0055, 0.005 ) ) ), object.nodeUniform19 ) * vec3<f32>( ( 1.0 - nodeVar14 ) ) ) );
	positionViewDirection = normalize( v_positionViewDirection );
	nodeVar28 = dot( normalView, positionViewDirection );
	nodeVar29 = textureSample( nodeUniform20, nodeUniform20_sampler, vec2<f32>( Roughness, clamp( nodeVar28, 0.0, 1.0 ) ) ).xy;
	let dfg = nodeVar29;
	nodeVar30 = ( dfg.x + dfg.y );
	nodeVar31 = ( 1.0 / nodeVar30 );
	nodeVar32 = nodeVar31;
	nodeVar33 = ( nodeVar32 - 1.0 );
	nodeVar34 = ( SpecularColorBlended * vec3<f32>( nodeVar33 ) );
	nodeVar35 = ( nodeVar34 + vec3<f32>( 1.0 ) );
	let multiScatteringCompensation = nodeVar35;
	irradiance = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar36 = dot( normalWorld, normalize( render.nodeUniform23 ) );
	nodeVar37 = ( nodeVar36 * 0.5 );
	nodeVar38 = ( nodeVar37 + 0.5 );
	nodeVar39 = mix( render.nodeUniform21, render.nodeUniform22, nodeVar38 );
	nodeVar40 = ( irradiance + nodeVar39 );
	irradiance = nodeVar40;
	nodeVar41 = ( render.nodeUniform24 - render.nodeUniform25 );
	nodeVar42 = vec4<f32>( nodeVar41, 0.0 );
	nodeVar43 = ( render.cameraViewMatrix * nodeVar42 );
	nodeVar44 = normalize( nodeVar43.xyz );
	nodeVar45 = nodeVar44;
	nodeVar46 = dot( normalView, nodeVar45 );
	nodeVar47 = ( vec3<f32>( clamp( nodeVar46, 0.0, 1.0 ) ) * render.nodeUniform26 );
	nodeVar48 = nodeVar47;
	directDiffuse = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar49 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar50 = ( nodeVar48 * nodeVar49 );
	nodeVar51 = ( nodeVar45 + positionViewDirection );
	nodeVar52 = normalize( nodeVar51 );
	nodeVar53 = dot( positionViewDirection, nodeVar52 );
	nodeVar54 = clamp( nodeVar53, 0.0, 1.0 );
	nodeVar55 = exp2( ( ( ( nodeVar54 * -5.55473 ) - 6.98316 ) * nodeVar54 ) );
	nodeVar56 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar55 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar55 ) ) );
	nodeVar57 = ( vec3<f32>( 1.0 ) - nodeVar56 );
	nodeVar58 = nodeVar57;
	nodeVar59 = ( nodeVar50 * nodeVar58 );
	nodeVar60 = ( directDiffuse + nodeVar59 );
	directDiffuse = nodeVar60;
	directSpecular = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar61 = normalize( ( nodeVar45 + positionViewDirection ) );
	nodeVar62 = clamp( dot( positionViewDirection, nodeVar61 ), 0.0, 1.0 );
	nodeVar63 = exp2( ( ( ( nodeVar62 * -5.55473 ) - 6.98316 ) * nodeVar62 ) );
	nodeVar64 = ( Roughness * Roughness );
	nodeVar65 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar63 ) ) ) + vec3<f32>( ( 1.0 * nodeVar63 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar64, clamp( dot( normalView, nodeVar45 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar64, clamp( dot( normalView, nodeVar61 ), 0.0, 1.0 ) ) ) );
	nodeVar66 = ( nodeVar48 * nodeVar65 );
	nodeVar67 = ( nodeVar66 * multiScatteringCompensation );
	nodeVar68 = ( directSpecular + nodeVar67 );
	directSpecular = nodeVar68;
	nodeVar69 = ( render.nodeUniform27 - render.nodeUniform28 );
	nodeVar70 = vec4<f32>( nodeVar69, 0.0 );
	nodeVar71 = ( render.cameraViewMatrix * nodeVar70 );
	nodeVar72 = normalize( nodeVar71.xyz );
	nodeVar73 = nodeVar72;
	nodeVar74 = dot( normalView, nodeVar73 );
	shadowPositionWorld = v_positionWorld;
	nodeVar76 = ( render.nodeUniform30 * vec4<f32>( ( shadowPositionWorld + ( normalWorld * vec3<f32>( render.nodeUniform31 ) ) ), 1.0 ) );
	nodeVar77 = ( nodeVar76.xyz / vec3<f32>( nodeVar76.w ) );
	nodeVar78 = vec3<f32>( nodeVar77.x, ( 1.0 - nodeVar77.y ), ( nodeVar77.z + render.nodeUniform32 ) );

	if ( ( ( ( ( ( nodeVar78.x >= 0.0 ) && ( nodeVar78.x <= 1.0 ) ) && ( nodeVar78.y >= 0.0 ) ) && ( nodeVar78.y <= 1.0 ) ) && ( nodeVar78.z <= 1.0 ) ) ) {

		nodeVar79 = ( interleavedGradientNoise( fragCoord.xy ) * 6.28318530718 );
		nodeVar80 = ( render.nodeUniform34 * ( vec2<f32>( 1.0, 1.0 ) / render.nodeUniform35 ).x );
		nodeVar81 = ( nodeVar78.xy + ( vogelDiskSample( 0, 5, nodeVar79 ) * vec2<f32>( nodeVar80 ) ) );
		nodeVar82 = textureSampleCompare( nodeUniform33, nodeUniform33_sampler, nodeVar81, nodeVar78.z );
		nodeVar83 = ( nodeVar78.xy + ( vogelDiskSample( 1, 5, nodeVar79 ) * vec2<f32>( nodeVar80 ) ) );
		nodeVar84 = textureSampleCompare( nodeUniform33, nodeUniform33_sampler, nodeVar83, nodeVar78.z );
		nodeVar85 = ( nodeVar78.xy + ( vogelDiskSample( 2, 5, nodeVar79 ) * vec2<f32>( nodeVar80 ) ) );
		nodeVar86 = textureSampleCompare( nodeUniform33, nodeUniform33_sampler, nodeVar85, nodeVar78.z );
		nodeVar87 = ( nodeVar78.xy + ( vogelDiskSample( 3, 5, nodeVar79 ) * vec2<f32>( nodeVar80 ) ) );
		nodeVar88 = textureSampleCompare( nodeUniform33, nodeUniform33_sampler, nodeVar87, nodeVar78.z );
		nodeVar89 = ( nodeVar78.xy + ( vogelDiskSample( 4, 5, nodeVar79 ) * vec2<f32>( nodeVar80 ) ) );
		nodeVar90 = textureSampleCompare( nodeUniform33, nodeUniform33_sampler, nodeVar89, nodeVar78.z );
		nodeVar75 = ( ( ( ( ( nodeVar82 + nodeVar84 ) + nodeVar86 ) + nodeVar88 ) + nodeVar90 ) * 0.2 );

	} else {

		nodeVar75 = 1.0;

	}

	nodeVar91 = mix( 1.0, nodeVar75, render.nodeUniform36 );
	nodeVar92 = ( vec3<f32>( clamp( nodeVar74, 0.0, 1.0 ) ) * ( render.nodeUniform29 * vec3<f32>( nodeVar91 ) ) );
	nodeVar93 = nodeVar92;
	nodeVar94 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar95 = ( nodeVar93 * nodeVar94 );
	nodeVar96 = ( nodeVar73 + positionViewDirection );
	nodeVar97 = normalize( nodeVar96 );
	nodeVar98 = dot( positionViewDirection, nodeVar97 );
	nodeVar99 = clamp( nodeVar98, 0.0, 1.0 );
	nodeVar100 = exp2( ( ( ( nodeVar99 * -5.55473 ) - 6.98316 ) * nodeVar99 ) );
	nodeVar101 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar100 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar100 ) ) );
	nodeVar102 = ( vec3<f32>( 1.0 ) - nodeVar101 );
	nodeVar103 = nodeVar102;
	nodeVar104 = ( nodeVar95 * nodeVar103 );
	nodeVar105 = ( directDiffuse + nodeVar104 );
	directDiffuse = nodeVar105;
	nodeVar106 = normalize( ( nodeVar73 + positionViewDirection ) );
	nodeVar107 = clamp( dot( positionViewDirection, nodeVar106 ), 0.0, 1.0 );
	nodeVar108 = exp2( ( ( ( nodeVar107 * -5.55473 ) - 6.98316 ) * nodeVar107 ) );
	nodeVar109 = ( Roughness * Roughness );
	nodeVar110 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar108 ) ) ) + vec3<f32>( ( 1.0 * nodeVar108 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar109, clamp( dot( normalView, nodeVar73 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar109, clamp( dot( normalView, nodeVar106 ), 0.0, 1.0 ) ) ) );
	nodeVar111 = ( nodeVar93 * nodeVar110 );
	nodeVar112 = ( nodeVar111 * multiScatteringCompensation );
	nodeVar113 = ( directSpecular + nodeVar112 );
	directSpecular = nodeVar113;
	nodeVar114 = ( render.nodeUniform37 - v_positionView );
	nodeVar115 = normalize( nodeVar114 );
	nodeVar116 = dot( normalView, nodeVar115 );

	if ( ( render.nodeUniform39 > 0.0 ) ) {

		nodeVar118 = length( nodeVar114 );
		nodeVar119 = ( nodeVar118 / render.nodeUniform39 );
		nodeVar120 = clamp( ( 1.0 - ( ( ( nodeVar119 * nodeVar119 ) * nodeVar119 ) * nodeVar119 ) ), 0.0, 1.0 );
		nodeVar117 = ( ( 1.0 / max( pow( nodeVar118, render.nodeUniform40 ), 0.01 ) ) * ( nodeVar120 * nodeVar120 ) );

	} else {

		nodeVar117 = ( 1.0 / max( pow( length( nodeVar114 ), render.nodeUniform40 ), 0.01 ) );

	}

	nodeVar121 = ( render.nodeUniform38 * vec3<f32>( nodeVar117 ) );
	nodeVar122 = ( vec3<f32>( clamp( nodeVar116, 0.0, 1.0 ) ) * nodeVar121 );
	nodeVar123 = nodeVar122;
	nodeVar124 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar125 = ( nodeVar123 * nodeVar124 );
	nodeVar126 = ( nodeVar115 + positionViewDirection );
	nodeVar127 = normalize( nodeVar126 );
	nodeVar128 = dot( positionViewDirection, nodeVar127 );
	nodeVar129 = clamp( nodeVar128, 0.0, 1.0 );
	nodeVar130 = exp2( ( ( ( nodeVar129 * -5.55473 ) - 6.98316 ) * nodeVar129 ) );
	nodeVar131 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar130 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar130 ) ) );
	nodeVar132 = ( vec3<f32>( 1.0 ) - nodeVar131 );
	nodeVar133 = nodeVar132;
	nodeVar134 = ( nodeVar125 * nodeVar133 );
	nodeVar135 = ( directDiffuse + nodeVar134 );
	directDiffuse = nodeVar135;
	nodeVar136 = normalize( ( nodeVar115 + positionViewDirection ) );
	nodeVar137 = clamp( dot( positionViewDirection, nodeVar136 ), 0.0, 1.0 );
	nodeVar138 = exp2( ( ( ( nodeVar137 * -5.55473 ) - 6.98316 ) * nodeVar137 ) );
	nodeVar139 = ( Roughness * Roughness );
	nodeVar140 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar138 ) ) ) + vec3<f32>( ( 1.0 * nodeVar138 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar139, clamp( dot( normalView, nodeVar115 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar139, clamp( dot( normalView, nodeVar136 ), 0.0, 1.0 ) ) ) );
	nodeVar141 = ( nodeVar123 * nodeVar140 );
	nodeVar142 = ( nodeVar141 * multiScatteringCompensation );
	nodeVar143 = ( directSpecular + nodeVar142 );
	directSpecular = nodeVar143;
	nodeVar144 = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar145 = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar146 = ( SpecularColor * vec3<f32>( dfg.x ) );
	nodeVar147 = ( SpecularF90 * dfg.y );
	nodeVar148 = ( nodeVar146 + vec3<f32>( nodeVar147 ) );
	nodeVar149 = ( nodeVar144 + nodeVar148 );
	nodeVar144 = nodeVar149;
	nodeVar150 = ( vec3<f32>( 1.0 ) - SpecularColor );
	nodeVar151 = nodeVar150;
	nodeVar152 = ( nodeVar151 * vec3<f32>( 0.047619 ) );
	nodeVar153 = ( SpecularColor + nodeVar152 );
	nodeVar154 = ( nodeVar148 * nodeVar153 );
	nodeVar155 = ( dfg.x + dfg.y );
	nodeVar156 = ( 1.0 - nodeVar155 );
	nodeVar157 = nodeVar156;
	nodeVar158 = ( vec3<f32>( nodeVar157 ) * nodeVar153 );
	nodeVar159 = ( vec3<f32>( 1.0 ) - nodeVar158 );
	nodeVar160 = nodeVar159;
	nodeVar161 = ( nodeVar154 / nodeVar160 );
	nodeVar162 = ( nodeVar161 * vec3<f32>( nodeVar157 ) );
	nodeVar163 = ( nodeVar145 + nodeVar162 );
	nodeVar145 = nodeVar163;
	nodeVar164 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar165 = ( irradiance * nodeVar164 );
	nodeVar166 = ( nodeVar144 + nodeVar145 );
	nodeVar167 = ( vec3<f32>( 1.0 ) - nodeVar166 );
	nodeVar168 = nodeVar167;
	nodeVar169 = ( nodeVar165 * nodeVar168 );
	nodeVar170 = nodeVar169;
	indirectDiffuse = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar171 = ( indirectDiffuse + nodeVar170 );
	indirectDiffuse = nodeVar171;
	singleScatteringDielectric = vec3<f32>( 0.0, 0.0, 0.0 );
	multiScatteringDielectric = vec3<f32>( 0.0, 0.0, 0.0 );
	singleScatteringMetallic = vec3<f32>( 0.0, 0.0, 0.0 );
	multiScatteringMetallic = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar172 = ( SpecularColor * vec3<f32>( dfg.x ) );
	nodeVar173 = ( SpecularF90 * dfg.y );
	nodeVar174 = ( nodeVar172 + vec3<f32>( nodeVar173 ) );
	nodeVar175 = ( singleScatteringDielectric + nodeVar174 );
	singleScatteringDielectric = nodeVar175;
	nodeVar176 = ( vec3<f32>( 1.0 ) - SpecularColor );
	nodeVar177 = nodeVar176;
	nodeVar178 = ( nodeVar177 * vec3<f32>( 0.047619 ) );
	nodeVar179 = ( SpecularColor + nodeVar178 );
	nodeVar180 = ( nodeVar174 * nodeVar179 );
	nodeVar181 = ( dfg.x + dfg.y );
	nodeVar182 = ( 1.0 - nodeVar181 );
	nodeVar183 = nodeVar182;
	nodeVar184 = ( vec3<f32>( nodeVar183 ) * nodeVar179 );
	nodeVar185 = ( vec3<f32>( 1.0 ) - nodeVar184 );
	nodeVar186 = nodeVar185;
	nodeVar187 = ( nodeVar180 / nodeVar186 );
	nodeVar188 = ( nodeVar187 * vec3<f32>( nodeVar183 ) );
	nodeVar189 = ( multiScatteringDielectric + nodeVar188 );
	multiScatteringDielectric = nodeVar189;
	nodeVar190 = ( DiffuseColor.xyz * vec3<f32>( dfg.x ) );
	nodeVar191 = ( SpecularF90 * dfg.y );
	nodeVar192 = ( nodeVar190 + vec3<f32>( nodeVar191 ) );
	nodeVar193 = ( singleScatteringMetallic + nodeVar192 );
	singleScatteringMetallic = nodeVar193;
	nodeVar194 = ( vec3<f32>( 1.0 ) - DiffuseColor.xyz );
	nodeVar195 = nodeVar194;
	nodeVar196 = ( nodeVar195 * vec3<f32>( 0.047619 ) );
	nodeVar197 = ( DiffuseColor.xyz + nodeVar196 );
	nodeVar198 = ( nodeVar192 * nodeVar197 );
	nodeVar199 = ( dfg.x + dfg.y );
	nodeVar200 = ( 1.0 - nodeVar199 );
	nodeVar201 = nodeVar200;
	nodeVar202 = ( vec3<f32>( nodeVar201 ) * nodeVar197 );
	nodeVar203 = ( vec3<f32>( 1.0 ) - nodeVar202 );
	nodeVar204 = nodeVar203;
	nodeVar205 = ( nodeVar198 / nodeVar204 );
	nodeVar206 = ( nodeVar205 * vec3<f32>( nodeVar201 ) );
	nodeVar207 = ( multiScatteringMetallic + nodeVar206 );
	multiScatteringMetallic = nodeVar207;
	radiance = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar208 = mix( singleScatteringDielectric, singleScatteringMetallic, Metalness );
	nodeVar209 = ( radiance * nodeVar208 );
	nodeVar210 = mix( multiScatteringDielectric, multiScatteringMetallic, Metalness );
	iblIrradiance = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar211 = ( iblIrradiance * vec3<f32>( 0.3183098861837907 ) );
	nodeVar212 = ( nodeVar210 * nodeVar211 );
	nodeVar213 = ( nodeVar209 + nodeVar212 );
	nodeVar214 = nodeVar213;
	nodeVar215 = ( singleScatteringDielectric + multiScatteringDielectric );
	nodeVar216 = ( vec3<f32>( 1.0 ) - nodeVar215 );
	nodeVar217 = nodeVar216;
	nodeVar218 = ( DiffuseContribution * nodeVar217 );
	nodeVar219 = ( nodeVar218 * nodeVar211 );
	nodeVar220 = nodeVar219;
	indirectSpecular = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar221 = ( indirectSpecular + nodeVar214 );
	indirectSpecular = nodeVar221;
	nodeVar222 = ( indirectDiffuse + nodeVar220 );
	indirectDiffuse = nodeVar222;
	ambientOcclusion = 1.0;
	nodeVar223 = ( indirectDiffuse * vec3<f32>( ambientOcclusion ) );
	indirectDiffuse = nodeVar223;
	nodeVar224 = dot( normalView, positionViewDirection );
	nodeVar225 = ( clamp( nodeVar224, 0.0, 1.0 ) + ambientOcclusion );
	nodeVar226 = ( Roughness * -16.0 );
	nodeVar227 = ( 1.0 - nodeVar226 );
	nodeVar228 = nodeVar227;
	nodeVar229 = ( - nodeVar228 );
	nodeVar230 = exp2( nodeVar229 );
	nodeVar231 = pow( nodeVar225, nodeVar230 );
	nodeVar232 = ( 1.0 - nodeVar231 );
	nodeVar233 = nodeVar232;
	nodeVar234 = ( ambientOcclusion - nodeVar233 );
	nodeVar235 = ( indirectSpecular * vec3<f32>( clamp( nodeVar234, 0.0, 1.0 ) ) );
	indirectSpecular = nodeVar235;
	nodeVar236 = ( directDiffuse + indirectDiffuse );
	totalDiffuse = nodeVar236;
	nodeVar237 = ( directSpecular + indirectSpecular );
	totalSpecular = nodeVar237;
	nodeVar238 = ( totalDiffuse + totalSpecular );
	outgoingLight = nodeVar238;
	Output = max( vec4<f32>( ( outgoingLight + EmissiveColor ), DiffuseColor.w ), vec4<f32>( 0.0 ) );
	nodeVar239 = ( - v_positionView.z );
	let nodeConst0 = max( ( 3.0 - v_positionWorld.y ), 0.0 );
	let nodeConst1 = ( nodeConst0 * ( - v_positionView.z ) );
	nodeVar240 = vec4<f32>( mix( Output.xyz, mix( object.nodeUniform41, object.nodeUniform42, pow( clamp( dot( normalize( ( v_positionWorld - render.cameraPosition ) ), object.nodeUniform43 ), 0.0, 1.0 ), 2.5 ) ), ( 1.0 - ( ( 1.0 - ( 1.0 - exp( ( - ( ( ( object.nodeUniform44 * object.nodeUniform44 ) * nodeVar239 ) * nodeVar239 ) ) ) ) ) * ( 1.0 - ( 1.0 - exp( ( - ( ( ( 0.0025 * 0.0025 ) * nodeConst1 ) * nodeConst1 ) ) ) ) ) ) ) ), Output.w );
	Output = nodeVar240;

	// result

	output.color = nodeVar240;

	return output;

}
