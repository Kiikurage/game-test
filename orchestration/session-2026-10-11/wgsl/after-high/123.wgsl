// Three.js r186 - Node System

// global
diagnostic( off, derivative_uniformity );


// structs

struct OutputStruct {
	@location( 0 ) color: vec4<f32>
};
var<private> output : OutputStruct;

// uniforms
@binding( 1 ) @group( 1 ) var nodeUniform5_sampler : sampler;
@binding( 2 ) @group( 1 ) var nodeUniform5 : texture_2d<f32>;
@binding( 3 ) @group( 1 ) var nodeUniform22_sampler : sampler;
@binding( 4 ) @group( 1 ) var nodeUniform22 : texture_2d<f32>;
@binding( 5 ) @group( 1 ) var nodeUniform35_sampler : sampler_comparison;
@binding( 6 ) @group( 1 ) var nodeUniform35 : texture_depth_2d;

struct renderStruct {
	cameraProjectionMatrix : mat4x4<f32>,
	cameraViewMatrix : mat4x4<f32>,
	nodeUniform24 : vec3<f32>,
	nodeUniform25 : vec3<f32>,
	nodeUniform23 : vec3<f32>,
	nodeUniform28 : vec3<f32>,
	nodeUniform31 : vec3<f32>,
	nodeUniform40 : vec3<f32>,
	nodeUniform41 : f32,
	nodeUniform42 : f32,
	nodeUniform26 : vec3<f32>,
	nodeUniform27 : vec3<f32>,
	nodeUniform29 : vec3<f32>,
	nodeUniform30 : vec3<f32>,
	nodeUniform39 : vec3<f32>,
	nodeUniform32 : mat4x4<f32>,
	nodeUniform33 : f32,
	nodeUniform34 : f32,
	nodeUniform38 : f32,
	cameraPosition : vec3<f32>,
	nodeUniform36 : f32,
	nodeUniform37 : vec2<f32>
};
@binding( 0 ) @group( 0 )
var<uniform> render : renderStruct;

struct objectStruct {
	nodeUniform0 : f32,
	nodeUniform2 : mat3x3<f32>,
	nodeUniform4 : f32,
	nodeUniform6 : mat4x4<f32>,
	nodeUniform7 : f32,
	nodeUniform8 : f32,
	nodeUniform9 : f32,
	nodeUniform10 : f32,
	nodeUniform11 : vec3<f32>,
	nodeUniform13 : vec3<f32>,
	nodeUniform14 : vec3<f32>,
	nodeUniform15 : vec3<f32>,
	nodeUniform16 : f32,
	nodeUniform17 : f32,
	nodeUniform18 : f32,
	nodeUniform19 : f32,
	nodeUniform20 : f32,
	nodeUniform21 : f32,
	nodeUniform43 : vec3<f32>,
	nodeUniform44 : vec3<f32>,
	nodeUniform45 : vec3<f32>,
	nodeUniform46 : f32
};
@binding( 0 ) @group( 1 )
var<uniform> object : objectStruct;

// vars
var<private> DiffuseColor : vec4<f32>;
var<private> normalViewGeometry : vec3<f32>;
var<private> NORMAL_normalView : vec3<f32>;
var<private> normalView : vec3<f32>;
var<private> normalWorld : vec3<f32>;
var<private> nodeVar0 : f32;
var<private> nodeVar1 : vec3<f32>;
var<private> nodeVar2 : f32;
var<private> nodeVar3 : f32;
var<private> nodeVar4 : vec2<f32>;
var<private> nodeVar5 : f32;
var<private> nodeVar6 : f32;
var<private> nodeVar7 : f32;
var<private> nodeVar8 : vec3<f32>;
var<private> nodeVar9 : f32;
var<private> Metalness : f32;
var<private> Roughness : f32;
var<private> nodeVar10 : vec3<f32>;
var<private> SpecularColor : vec3<f32>;
var<private> SpecularColorBlended : vec3<f32>;
var<private> SpecularF90 : f32;
var<private> DiffuseContribution : vec3<f32>;
var<private> EmissiveColor : vec3<f32>;
var<private> nodeVar11 : vec3<f32>;
var<private> nodeVar12 : vec3<f32>;
var<private> nodeVar13 : f32;
var<private> nodeVar14 : f32;
var<private> nodeVar15 : vec2<f32>;
var<private> nodeVar16 : vec3<f32>;
var<private> nodeVar17 : f32;
var<private> nodeVar18 : f32;
var<private> nodeVar19 : vec2<f32>;
var<private> nodeVar20 : vec3<f32>;
var<private> nodeVar21 : f32;
var<private> nodeVar22 : f32;
var<private> nodeVar23 : vec2<f32>;
var<private> nodeVar24 : f32;
var<private> nodeVar25 : vec3<f32>;
var<private> nodeVar26 : vec3<f32>;
var<private> nodeVar27 : f32;
var<private> nodeVar28 : f32;
var<private> nodeVar29 : f32;
var<private> Output : vec4<f32>;
var<private> positionViewDirection : vec3<f32>;
var<private> nodeVar30 : f32;
var<private> nodeVar31 : vec2<f32>;
var<private> nodeVar32 : f32;
var<private> nodeVar33 : f32;
var<private> nodeVar34 : f32;
var<private> nodeVar35 : f32;
var<private> nodeVar36 : vec3<f32>;
var<private> nodeVar37 : vec3<f32>;
var<private> irradiance : vec3<f32>;
var<private> nodeVar38 : f32;
var<private> nodeVar39 : f32;
var<private> nodeVar40 : f32;
var<private> nodeVar41 : vec3<f32>;
var<private> nodeVar42 : vec3<f32>;
var<private> nodeVar43 : vec3<f32>;
var<private> nodeVar44 : vec4<f32>;
var<private> nodeVar45 : vec4<f32>;
var<private> nodeVar46 : vec3<f32>;
var<private> nodeVar47 : vec3<f32>;
var<private> nodeVar48 : f32;
var<private> nodeVar49 : vec3<f32>;
var<private> nodeVar50 : vec3<f32>;
var<private> directDiffuse : vec3<f32>;
var<private> nodeVar51 : vec3<f32>;
var<private> nodeVar52 : vec3<f32>;
var<private> nodeVar53 : vec3<f32>;
var<private> nodeVar54 : vec3<f32>;
var<private> nodeVar55 : f32;
var<private> nodeVar56 : f32;
var<private> nodeVar57 : f32;
var<private> nodeVar58 : vec3<f32>;
var<private> nodeVar59 : vec3<f32>;
var<private> nodeVar60 : vec3<f32>;
var<private> nodeVar61 : vec3<f32>;
var<private> nodeVar62 : vec3<f32>;
var<private> directSpecular : vec3<f32>;
var<private> nodeVar63 : vec3<f32>;
var<private> nodeVar64 : f32;
var<private> nodeVar65 : f32;
var<private> nodeVar66 : f32;
var<private> nodeVar67 : vec3<f32>;
var<private> nodeVar68 : vec3<f32>;
var<private> nodeVar69 : vec3<f32>;
var<private> nodeVar70 : vec3<f32>;
var<private> nodeVar71 : vec3<f32>;
var<private> nodeVar72 : vec4<f32>;
var<private> nodeVar73 : vec4<f32>;
var<private> nodeVar74 : vec3<f32>;
var<private> nodeVar75 : vec3<f32>;
var<private> nodeVar76 : f32;
var<private> shadowPositionWorld : vec3<f32>;
var<private> nodeVar77 : f32;
var<private> nodeVar78 : vec4<f32>;
var<private> nodeVar79 : vec3<f32>;
var<private> nodeVar80 : vec3<f32>;
var<private> nodeVar81 : f32;
var<private> nodeVar82 : f32;
var<private> nodeVar83 : vec2<f32>;
var<private> nodeVar84 : f32;
var<private> nodeVar85 : vec2<f32>;
var<private> nodeVar86 : f32;
var<private> nodeVar87 : vec2<f32>;
var<private> nodeVar88 : f32;
var<private> nodeVar89 : vec2<f32>;
var<private> nodeVar90 : f32;
var<private> nodeVar91 : vec2<f32>;
var<private> nodeVar92 : f32;
var<private> nodeVar93 : f32;
var<private> nodeVar94 : vec3<f32>;
var<private> nodeVar95 : vec3<f32>;
var<private> nodeVar96 : vec3<f32>;
var<private> nodeVar97 : vec3<f32>;
var<private> nodeVar98 : vec3<f32>;
var<private> nodeVar99 : vec3<f32>;
var<private> nodeVar100 : f32;
var<private> nodeVar101 : f32;
var<private> nodeVar102 : f32;
var<private> nodeVar103 : vec3<f32>;
var<private> nodeVar104 : vec3<f32>;
var<private> nodeVar105 : vec3<f32>;
var<private> nodeVar106 : vec3<f32>;
var<private> nodeVar107 : vec3<f32>;
var<private> nodeVar108 : vec3<f32>;
var<private> nodeVar109 : f32;
var<private> nodeVar110 : f32;
var<private> nodeVar111 : f32;
var<private> nodeVar112 : vec3<f32>;
var<private> nodeVar113 : vec3<f32>;
var<private> nodeVar114 : vec3<f32>;
var<private> nodeVar115 : vec3<f32>;
var<private> nodeVar116 : vec3<f32>;
var<private> nodeVar117 : vec3<f32>;
var<private> nodeVar118 : f32;
var<private> nodeVar119 : f32;
var<private> nodeVar120 : f32;
var<private> nodeVar121 : f32;
var<private> nodeVar122 : f32;
var<private> nodeVar123 : vec3<f32>;
var<private> nodeVar124 : vec3<f32>;
var<private> nodeVar125 : vec3<f32>;
var<private> nodeVar126 : vec3<f32>;
var<private> nodeVar127 : vec3<f32>;
var<private> nodeVar128 : vec3<f32>;
var<private> nodeVar129 : vec3<f32>;
var<private> nodeVar130 : f32;
var<private> nodeVar131 : f32;
var<private> nodeVar132 : f32;
var<private> nodeVar133 : vec3<f32>;
var<private> nodeVar134 : vec3<f32>;
var<private> nodeVar135 : vec3<f32>;
var<private> nodeVar136 : vec3<f32>;
var<private> nodeVar137 : vec3<f32>;
var<private> nodeVar138 : vec3<f32>;
var<private> nodeVar139 : f32;
var<private> nodeVar140 : f32;
var<private> nodeVar141 : f32;
var<private> nodeVar142 : vec3<f32>;
var<private> nodeVar143 : vec3<f32>;
var<private> nodeVar144 : vec3<f32>;
var<private> nodeVar145 : vec3<f32>;
var<private> nodeVar146 : vec3<f32>;
var<private> nodeVar147 : vec3<f32>;
var<private> nodeVar148 : vec3<f32>;
var<private> nodeVar149 : f32;
var<private> nodeVar150 : vec3<f32>;
var<private> nodeVar151 : vec3<f32>;
var<private> nodeVar152 : vec3<f32>;
var<private> nodeVar153 : vec3<f32>;
var<private> nodeVar154 : vec3<f32>;
var<private> nodeVar155 : vec3<f32>;
var<private> nodeVar156 : vec3<f32>;
var<private> nodeVar157 : f32;
var<private> nodeVar158 : f32;
var<private> nodeVar159 : f32;
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
var<private> nodeVar171 : vec3<f32>;
var<private> nodeVar172 : vec3<f32>;
var<private> indirectDiffuse : vec3<f32>;
var<private> nodeVar173 : vec3<f32>;
var<private> singleScatteringDielectric : vec3<f32>;
var<private> multiScatteringDielectric : vec3<f32>;
var<private> singleScatteringMetallic : vec3<f32>;
var<private> multiScatteringMetallic : vec3<f32>;
var<private> nodeVar174 : vec3<f32>;
var<private> nodeVar175 : f32;
var<private> nodeVar176 : vec3<f32>;
var<private> nodeVar177 : vec3<f32>;
var<private> nodeVar178 : vec3<f32>;
var<private> nodeVar179 : vec3<f32>;
var<private> nodeVar180 : vec3<f32>;
var<private> nodeVar181 : vec3<f32>;
var<private> nodeVar182 : vec3<f32>;
var<private> nodeVar183 : f32;
var<private> nodeVar184 : f32;
var<private> nodeVar185 : f32;
var<private> nodeVar186 : vec3<f32>;
var<private> nodeVar187 : vec3<f32>;
var<private> nodeVar188 : vec3<f32>;
var<private> nodeVar189 : vec3<f32>;
var<private> nodeVar190 : vec3<f32>;
var<private> nodeVar191 : vec3<f32>;
var<private> nodeVar192 : vec3<f32>;
var<private> nodeVar193 : f32;
var<private> nodeVar194 : vec3<f32>;
var<private> nodeVar195 : vec3<f32>;
var<private> nodeVar196 : vec3<f32>;
var<private> nodeVar197 : vec3<f32>;
var<private> nodeVar198 : vec3<f32>;
var<private> nodeVar199 : vec3<f32>;
var<private> nodeVar200 : vec3<f32>;
var<private> nodeVar201 : f32;
var<private> nodeVar202 : f32;
var<private> nodeVar203 : f32;
var<private> nodeVar204 : vec3<f32>;
var<private> nodeVar205 : vec3<f32>;
var<private> nodeVar206 : vec3<f32>;
var<private> nodeVar207 : vec3<f32>;
var<private> nodeVar208 : vec3<f32>;
var<private> nodeVar209 : vec3<f32>;
var<private> radiance : vec3<f32>;
var<private> nodeVar210 : vec3<f32>;
var<private> nodeVar211 : vec3<f32>;
var<private> nodeVar212 : vec3<f32>;
var<private> iblIrradiance : vec3<f32>;
var<private> nodeVar213 : vec3<f32>;
var<private> nodeVar214 : vec3<f32>;
var<private> nodeVar215 : vec3<f32>;
var<private> nodeVar216 : vec3<f32>;
var<private> nodeVar217 : vec3<f32>;
var<private> nodeVar218 : vec3<f32>;
var<private> nodeVar219 : vec3<f32>;
var<private> nodeVar220 : vec3<f32>;
var<private> nodeVar221 : vec3<f32>;
var<private> nodeVar222 : vec3<f32>;
var<private> indirectSpecular : vec3<f32>;
var<private> nodeVar223 : vec3<f32>;
var<private> nodeVar224 : vec3<f32>;
var<private> ambientOcclusion : f32;
var<private> nodeVar225 : vec3<f32>;
var<private> nodeVar226 : f32;
var<private> nodeVar227 : f32;
var<private> nodeVar228 : f32;
var<private> nodeVar229 : f32;
var<private> nodeVar230 : f32;
var<private> nodeVar231 : f32;
var<private> nodeVar232 : f32;
var<private> nodeVar233 : f32;
var<private> nodeVar234 : f32;
var<private> nodeVar235 : f32;
var<private> nodeVar236 : f32;
var<private> nodeVar237 : vec3<f32>;
var<private> totalDiffuse : vec3<f32>;
var<private> nodeVar238 : vec3<f32>;
var<private> totalSpecular : vec3<f32>;
var<private> nodeVar239 : vec3<f32>;
var<private> outgoingLight : vec3<f32>;
var<private> nodeVar240 : vec3<f32>;
var<private> nodeVar241 : f32;
var<private> nodeVar242 : vec4<f32>;

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
fn main( @location( 0 ) positionLocal : vec3<f32>,
	@location( 1 ) v_positionView : vec3<f32>,
	@location( 2 ) v_positionWorld : vec3<f32>,
	@location( 3 ) v_normalViewGeometry : vec3<f32>,
	@location( 4 ) v_positionViewDirection : vec3<f32>,
	@location( 5 ) nodeVarying7 : vec4<f32>,
	@location( 6 ) nodeVarying8 : vec2<f32>,
	@builtin( position ) fragCoord : vec4<f32> ) -> OutputStruct {

	// flow
	// code

	normalViewGeometry = normalize( v_normalViewGeometry );
	NORMAL_normalView = normalViewGeometry;
	normalView = NORMAL_normalView;
	normalWorld = normalize( ( vec4<f32>( normalView, 0.0 ) * render.cameraViewMatrix ).xyz );
	nodeVar0 = mix( -0.11, 1.01, object.nodeUniform4 );
	nodeVar1 = fract( ( ( v_positionWorld * vec3<f32>( 4.2 ) ) / vec3<f32>( 8.0 ) ) );
	nodeVar2 = ( nodeVar1.z * 64.0 );
	nodeVar3 = floor( nodeVar2 );
	nodeVar4 = textureSample( nodeUniform5, nodeUniform5_sampler, ( ( ( ( vec2<f32>( tsl_mod_float( nodeVar3, 8.0 ), floor( ( nodeVar3 / 8.0 ) ) ) * vec2<f32>( 66.0 ) ) + ( nodeVar1.xy * vec2<f32>( 64.0 ) ) ) + vec2<f32>( 1.5 ) ) / vec2<f32>( 528.0 ) ) ).xy;
	nodeVar5 = clamp( ( ( mix( nodeVar4.x, nodeVar4.y, ( nodeVar2 - nodeVar3 ) ) * 0.9 ) + 0.5 ), 0.0, 1.0 );
	nodeVar6 = ( 1.0 - smoothstep( nodeVar0, ( nodeVar0 + 0.1 ), nodeVar5 ) );
	nodeVar7 = ( nodeVar6 * nodeVar6 );
	nodeVar8 = mix( ( ( mix( mix( nodeVarying7.xyz, ( ( vec3<f32>( dot( nodeVarying7.xyz, vec3<f32>( 0.2126, 0.7152, 0.0722 ) ) ) * vec3<f32>( 0.9, 1.0, 1.16 ) ) * vec3<f32>( 1.35 ) ), 0.0 ), ( vec3<f32>( 0.14412847084818123, 0.06847816983662762, 0.0343398068028541 ) * vec3<f32>( 0.35 ) ), 0.08 ) * vec3<f32>( 1.25 ) ) + ( vec3<f32>( 0.5, 0.48, 0.45 ) * vec3<f32>( ( smoothstep( 0.55, 1.0, normalWorld.y ) * 0.0 ) ) ) ), vec3<f32>( 0.007499032040460618, 0.005605391621829108, 0.004776953478513362 ), ( nodeVar7 * 0.9 ) );
	DiffuseColor = vec4<f32>( nodeVar8, 1.0 );

	if ( ( nodeVar5 > nodeVar0 ) ) {

		nodeVar9 = 1.0;

	} else {

		nodeVar9 = 0.0;

	}

	DiffuseColor.w = ( DiffuseColor.w * nodeVar9 );

	if ( ( DiffuseColor.w <= object.nodeUniform7 ) ) {

		discard;
		

	}

	DiffuseColor.w = 1.0;
	Metalness = object.nodeUniform8;
	nodeVar10 = max( abs( dpdx( normalViewGeometry ) ), abs( - dpdy( normalViewGeometry ) ) );
	Roughness = min( ( max( object.nodeUniform9, 0.0525 ) + max( max( nodeVar10.x, nodeVar10.y ), nodeVar10.z ) ), 1.0 );
	SpecularColor = vec3<f32>( 0.04, 0.04, 0.04 );
	SpecularColorBlended = mix( vec3<f32>( 0.04, 0.04, 0.04 ), DiffuseColor.xyz, Metalness );
	SpecularF90 = 1.0;
	DiffuseContribution = ( DiffuseColor.xyz * vec3<f32>( ( 1.0 - object.nodeUniform8 ) ) );
	nodeVar11 = ( positionLocal * vec3<f32>( 5.5 ) );
	nodeVar12 = fract( ( nodeVar11 / vec3<f32>( 8.0 ) ) );
	nodeVar13 = ( nodeVar12.z * 64.0 );
	nodeVar14 = floor( nodeVar13 );
	nodeVar15 = textureSample( nodeUniform5, nodeUniform5_sampler, ( ( ( ( vec2<f32>( tsl_mod_float( nodeVar14, 8.0 ), floor( ( nodeVar14 / 8.0 ) ) ) * vec2<f32>( 66.0 ) ) + ( nodeVar12.xy * vec2<f32>( 64.0 ) ) ) + vec2<f32>( 1.5 ) ) / vec2<f32>( 528.0 ) ) ).xy;
	nodeVar16 = fract( ( ( ( nodeVar11 * vec3<f32>( 0.23 ) ) + vec3<f32>( 7.3 ) ) / vec3<f32>( 8.0 ) ) );
	nodeVar17 = ( nodeVar16.z * 64.0 );
	nodeVar18 = floor( nodeVar17 );
	nodeVar19 = textureSample( nodeUniform5, nodeUniform5_sampler, ( ( ( ( vec2<f32>( tsl_mod_float( nodeVar18, 8.0 ), floor( ( nodeVar18 / 8.0 ) ) ) * vec2<f32>( 66.0 ) ) + ( nodeVar16.xy * vec2<f32>( 64.0 ) ) ) + vec2<f32>( 1.5 ) ) / vec2<f32>( 528.0 ) ) ).xy;
	nodeVar20 = fract( ( ( ( positionLocal * vec3<f32>( 13.2 ) ) + vec3<f32>( 3.7 ) ) / vec3<f32>( 8.0 ) ) );
	nodeVar21 = ( nodeVar20.z * 64.0 );
	nodeVar22 = floor( nodeVar21 );
	nodeVar23 = textureSample( nodeUniform5, nodeUniform5_sampler, ( ( ( ( vec2<f32>( tsl_mod_float( nodeVar22, 8.0 ), floor( ( nodeVar22 / 8.0 ) ) ) * vec2<f32>( 66.0 ) ) + ( nodeVar20.xy * vec2<f32>( 64.0 ) ) ) + vec2<f32>( 1.5 ) ) / vec2<f32>( 528.0 ) ) ).xy;

	if ( ( object.nodeUniform4 > 0.0 ) ) {

		nodeVar24 = 3.2;

	} else {

		nodeVar24 = 0.0;

	}

	nodeVar25 = normalize( normalWorld );
	nodeVar26 = normalize( ( render.cameraPosition - v_positionWorld ) );
	nodeVar27 = pow( ( 1.0 - clamp( dot( nodeVar25, nodeVar26 ), 0.0, 1.0 ) ), 3.0 );
	nodeVar28 = smoothstep( -0.35, 0.55, dot( nodeVar25, object.nodeUniform13 ) );
	nodeVar29 = smoothstep( -0.15, 0.85, ( - dot( nodeVar26, object.nodeUniform13 ) ) );
	EmissiveColor = ( ( ( ( vec3<f32>( 1.0, 0.10224173307914941, 0.0069954101845983935 ) * vec3<f32>( object.nodeUniform10 ) ) * vec3<f32>( ( ( ( ( ( 1.0 - smoothstep( 0.0, 0.032, abs( mix( nodeVar15.x, nodeVar15.y, ( nodeVar13 - nodeVar14 ) ) ) ) ) * smoothstep( 0.05, 0.5, mix( nodeVar19.x, nodeVar19.y, ( nodeVar17 - nodeVar18 ) ) ) ) * 1.1 ) + ( ( ( smoothstep( 0.3, 0.43, positionLocal.x ) * smoothstep( 0.5, 0.64, positionLocal.y ) ) * 0.95 ) + ( ( smoothstep( 0.1, 0.3, positionLocal.x ) * smoothstep( 0.45, 0.62, positionLocal.y ) ) * 0.12 ) ) ) + ( ( 1.0 - smoothstep( -0.25, 0.35, mix( nodeVar23.x, nodeVar23.y, ( nodeVar21 - nodeVar22 ) ) ) ) * 0.03 ) ) ) ) + ( ( vec3<f32>( 1.0, 0.10224173307914941, 0.0069954101845983935 ) * vec3<f32>( smoothstep( 0.35, 1.0, nodeVar6 ) ) ) * vec3<f32>( nodeVar24 ) ) ) + ( mix( vec3<f32>( 0.0, 0.0, 0.0 ), ( ( ( ( ( ( object.nodeUniform11 * vec3<f32>( nodeVar27 ) ) * vec3<f32>( nodeVar28 ) ) * vec3<f32>( ( ( nodeVar29 * 1.38 ) + 0.12 ) ) ) + ( ( ( object.nodeUniform14 * vec3<f32>( nodeVar27 ) ) * vec3<f32>( ( 1.0 - ( nodeVar28 * nodeVar29 ) ) ) ) * vec3<f32>( 0.18 ) ) ) + ( ( object.nodeUniform15 * vec3<f32>( object.nodeUniform16 ) ) * vec3<f32>( mix( ( ( pow( ( 1.0 - abs( dot( nodeVar25, nodeVar26 ) ) ), ( object.nodeUniform17 + 3.0 ) ) * ( object.nodeUniform18 * 6.0 ) ) + ( object.nodeUniform19 * 1.8 ) ), ( ( smoothstep( 0.8, 0.96, nodeVarying8.x ) * ( object.nodeUniform18 * 1.7 ) ) + ( pow( smoothstep( 0.35, 1.0, nodeVarying8.x ), 2.0 ) * ( object.nodeUniform19 * 0.5 ) ) ), object.nodeUniform20 ) ) ) ) + ( ( ( nodeVar8 * vec3<f32>( 0.07 ) ) * vec3<f32>( ( 1.0 - ( smoothstep( 0.0, 0.5, dot( nodeVar8, vec3<f32>( 0.299, 0.587, 0.114 ) ) ) * 0.6 ) ) ) ) + vec3<f32>( 0.006, 0.0055, 0.005 ) ) ), object.nodeUniform21 ) * vec3<f32>( ( 1.0 - nodeVar7 ) ) ) );
	positionViewDirection = normalize( v_positionViewDirection );
	nodeVar30 = dot( normalView, positionViewDirection );
	nodeVar31 = textureSample( nodeUniform22, nodeUniform22_sampler, vec2<f32>( Roughness, clamp( nodeVar30, 0.0, 1.0 ) ) ).xy;
	let dfg = nodeVar31;
	nodeVar32 = ( dfg.x + dfg.y );
	nodeVar33 = ( 1.0 / nodeVar32 );
	nodeVar34 = nodeVar33;
	nodeVar35 = ( nodeVar34 - 1.0 );
	nodeVar36 = ( SpecularColorBlended * vec3<f32>( nodeVar35 ) );
	nodeVar37 = ( nodeVar36 + vec3<f32>( 1.0 ) );
	let multiScatteringCompensation = nodeVar37;
	irradiance = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar38 = dot( normalWorld, normalize( render.nodeUniform25 ) );
	nodeVar39 = ( nodeVar38 * 0.5 );
	nodeVar40 = ( nodeVar39 + 0.5 );
	nodeVar41 = mix( render.nodeUniform23, render.nodeUniform24, nodeVar40 );
	nodeVar42 = ( irradiance + nodeVar41 );
	irradiance = nodeVar42;
	nodeVar43 = ( render.nodeUniform26 - render.nodeUniform27 );
	nodeVar44 = vec4<f32>( nodeVar43, 0.0 );
	nodeVar45 = ( render.cameraViewMatrix * nodeVar44 );
	nodeVar46 = normalize( nodeVar45.xyz );
	nodeVar47 = nodeVar46;
	nodeVar48 = dot( normalView, nodeVar47 );
	nodeVar49 = ( vec3<f32>( clamp( nodeVar48, 0.0, 1.0 ) ) * render.nodeUniform28 );
	nodeVar50 = nodeVar49;
	directDiffuse = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar51 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar52 = ( nodeVar50 * nodeVar51 );
	nodeVar53 = ( nodeVar47 + positionViewDirection );
	nodeVar54 = normalize( nodeVar53 );
	nodeVar55 = dot( positionViewDirection, nodeVar54 );
	nodeVar56 = clamp( nodeVar55, 0.0, 1.0 );
	nodeVar57 = exp2( ( ( ( nodeVar56 * -5.55473 ) - 6.98316 ) * nodeVar56 ) );
	nodeVar58 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar57 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar57 ) ) );
	nodeVar59 = ( vec3<f32>( 1.0 ) - nodeVar58 );
	nodeVar60 = nodeVar59;
	nodeVar61 = ( nodeVar52 * nodeVar60 );
	nodeVar62 = ( directDiffuse + nodeVar61 );
	directDiffuse = nodeVar62;
	directSpecular = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar63 = normalize( ( nodeVar47 + positionViewDirection ) );
	nodeVar64 = clamp( dot( positionViewDirection, nodeVar63 ), 0.0, 1.0 );
	nodeVar65 = exp2( ( ( ( nodeVar64 * -5.55473 ) - 6.98316 ) * nodeVar64 ) );
	nodeVar66 = ( Roughness * Roughness );
	nodeVar67 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar65 ) ) ) + vec3<f32>( ( 1.0 * nodeVar65 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar66, clamp( dot( normalView, nodeVar47 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar66, clamp( dot( normalView, nodeVar63 ), 0.0, 1.0 ) ) ) );
	nodeVar68 = ( nodeVar50 * nodeVar67 );
	nodeVar69 = ( nodeVar68 * multiScatteringCompensation );
	nodeVar70 = ( directSpecular + nodeVar69 );
	directSpecular = nodeVar70;
	nodeVar71 = ( render.nodeUniform29 - render.nodeUniform30 );
	nodeVar72 = vec4<f32>( nodeVar71, 0.0 );
	nodeVar73 = ( render.cameraViewMatrix * nodeVar72 );
	nodeVar74 = normalize( nodeVar73.xyz );
	nodeVar75 = nodeVar74;
	nodeVar76 = dot( normalView, nodeVar75 );
	shadowPositionWorld = v_positionWorld;
	nodeVar78 = ( render.nodeUniform32 * vec4<f32>( ( shadowPositionWorld + ( normalWorld * vec3<f32>( render.nodeUniform33 ) ) ), 1.0 ) );
	nodeVar79 = ( nodeVar78.xyz / vec3<f32>( nodeVar78.w ) );
	nodeVar80 = vec3<f32>( nodeVar79.x, ( 1.0 - nodeVar79.y ), ( nodeVar79.z + render.nodeUniform34 ) );

	if ( ( ( ( ( ( nodeVar80.x >= 0.0 ) && ( nodeVar80.x <= 1.0 ) ) && ( nodeVar80.y >= 0.0 ) ) && ( nodeVar80.y <= 1.0 ) ) && ( nodeVar80.z <= 1.0 ) ) ) {

		nodeVar81 = ( interleavedGradientNoise( fragCoord.xy ) * 6.28318530718 );
		nodeVar82 = ( render.nodeUniform36 * ( vec2<f32>( 1.0, 1.0 ) / render.nodeUniform37 ).x );
		nodeVar83 = ( nodeVar80.xy + ( vogelDiskSample( 0, 5, nodeVar81 ) * vec2<f32>( nodeVar82 ) ) );
		nodeVar84 = textureSampleCompare( nodeUniform35, nodeUniform35_sampler, nodeVar83, nodeVar80.z );
		nodeVar85 = ( nodeVar80.xy + ( vogelDiskSample( 1, 5, nodeVar81 ) * vec2<f32>( nodeVar82 ) ) );
		nodeVar86 = textureSampleCompare( nodeUniform35, nodeUniform35_sampler, nodeVar85, nodeVar80.z );
		nodeVar87 = ( nodeVar80.xy + ( vogelDiskSample( 2, 5, nodeVar81 ) * vec2<f32>( nodeVar82 ) ) );
		nodeVar88 = textureSampleCompare( nodeUniform35, nodeUniform35_sampler, nodeVar87, nodeVar80.z );
		nodeVar89 = ( nodeVar80.xy + ( vogelDiskSample( 3, 5, nodeVar81 ) * vec2<f32>( nodeVar82 ) ) );
		nodeVar90 = textureSampleCompare( nodeUniform35, nodeUniform35_sampler, nodeVar89, nodeVar80.z );
		nodeVar91 = ( nodeVar80.xy + ( vogelDiskSample( 4, 5, nodeVar81 ) * vec2<f32>( nodeVar82 ) ) );
		nodeVar92 = textureSampleCompare( nodeUniform35, nodeUniform35_sampler, nodeVar91, nodeVar80.z );
		nodeVar77 = ( ( ( ( ( nodeVar84 + nodeVar86 ) + nodeVar88 ) + nodeVar90 ) + nodeVar92 ) * 0.2 );

	} else {

		nodeVar77 = 1.0;

	}

	nodeVar93 = mix( 1.0, nodeVar77, render.nodeUniform38 );
	nodeVar94 = ( vec3<f32>( clamp( nodeVar76, 0.0, 1.0 ) ) * ( render.nodeUniform31 * vec3<f32>( nodeVar93 ) ) );
	nodeVar95 = nodeVar94;
	nodeVar96 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar97 = ( nodeVar95 * nodeVar96 );
	nodeVar98 = ( nodeVar75 + positionViewDirection );
	nodeVar99 = normalize( nodeVar98 );
	nodeVar100 = dot( positionViewDirection, nodeVar99 );
	nodeVar101 = clamp( nodeVar100, 0.0, 1.0 );
	nodeVar102 = exp2( ( ( ( nodeVar101 * -5.55473 ) - 6.98316 ) * nodeVar101 ) );
	nodeVar103 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar102 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar102 ) ) );
	nodeVar104 = ( vec3<f32>( 1.0 ) - nodeVar103 );
	nodeVar105 = nodeVar104;
	nodeVar106 = ( nodeVar97 * nodeVar105 );
	nodeVar107 = ( directDiffuse + nodeVar106 );
	directDiffuse = nodeVar107;
	nodeVar108 = normalize( ( nodeVar75 + positionViewDirection ) );
	nodeVar109 = clamp( dot( positionViewDirection, nodeVar108 ), 0.0, 1.0 );
	nodeVar110 = exp2( ( ( ( nodeVar109 * -5.55473 ) - 6.98316 ) * nodeVar109 ) );
	nodeVar111 = ( Roughness * Roughness );
	nodeVar112 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar110 ) ) ) + vec3<f32>( ( 1.0 * nodeVar110 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar111, clamp( dot( normalView, nodeVar75 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar111, clamp( dot( normalView, nodeVar108 ), 0.0, 1.0 ) ) ) );
	nodeVar113 = ( nodeVar95 * nodeVar112 );
	nodeVar114 = ( nodeVar113 * multiScatteringCompensation );
	nodeVar115 = ( directSpecular + nodeVar114 );
	directSpecular = nodeVar115;
	nodeVar116 = ( render.nodeUniform39 - v_positionView );
	nodeVar117 = normalize( nodeVar116 );
	nodeVar118 = dot( normalView, nodeVar117 );

	if ( ( render.nodeUniform41 > 0.0 ) ) {

		nodeVar120 = length( nodeVar116 );
		nodeVar121 = ( nodeVar120 / render.nodeUniform41 );
		nodeVar122 = clamp( ( 1.0 - ( ( ( nodeVar121 * nodeVar121 ) * nodeVar121 ) * nodeVar121 ) ), 0.0, 1.0 );
		nodeVar119 = ( ( 1.0 / max( pow( nodeVar120, render.nodeUniform42 ), 0.01 ) ) * ( nodeVar122 * nodeVar122 ) );

	} else {

		nodeVar119 = ( 1.0 / max( pow( length( nodeVar116 ), render.nodeUniform42 ), 0.01 ) );

	}

	nodeVar123 = ( render.nodeUniform40 * vec3<f32>( nodeVar119 ) );
	nodeVar124 = ( vec3<f32>( clamp( nodeVar118, 0.0, 1.0 ) ) * nodeVar123 );
	nodeVar125 = nodeVar124;
	nodeVar126 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar127 = ( nodeVar125 * nodeVar126 );
	nodeVar128 = ( nodeVar117 + positionViewDirection );
	nodeVar129 = normalize( nodeVar128 );
	nodeVar130 = dot( positionViewDirection, nodeVar129 );
	nodeVar131 = clamp( nodeVar130, 0.0, 1.0 );
	nodeVar132 = exp2( ( ( ( nodeVar131 * -5.55473 ) - 6.98316 ) * nodeVar131 ) );
	nodeVar133 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar132 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar132 ) ) );
	nodeVar134 = ( vec3<f32>( 1.0 ) - nodeVar133 );
	nodeVar135 = nodeVar134;
	nodeVar136 = ( nodeVar127 * nodeVar135 );
	nodeVar137 = ( directDiffuse + nodeVar136 );
	directDiffuse = nodeVar137;
	nodeVar138 = normalize( ( nodeVar117 + positionViewDirection ) );
	nodeVar139 = clamp( dot( positionViewDirection, nodeVar138 ), 0.0, 1.0 );
	nodeVar140 = exp2( ( ( ( nodeVar139 * -5.55473 ) - 6.98316 ) * nodeVar139 ) );
	nodeVar141 = ( Roughness * Roughness );
	nodeVar142 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar140 ) ) ) + vec3<f32>( ( 1.0 * nodeVar140 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar141, clamp( dot( normalView, nodeVar117 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar141, clamp( dot( normalView, nodeVar138 ), 0.0, 1.0 ) ) ) );
	nodeVar143 = ( nodeVar125 * nodeVar142 );
	nodeVar144 = ( nodeVar143 * multiScatteringCompensation );
	nodeVar145 = ( directSpecular + nodeVar144 );
	directSpecular = nodeVar145;
	nodeVar146 = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar147 = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar148 = ( SpecularColor * vec3<f32>( dfg.x ) );
	nodeVar149 = ( SpecularF90 * dfg.y );
	nodeVar150 = ( nodeVar148 + vec3<f32>( nodeVar149 ) );
	nodeVar151 = ( nodeVar146 + nodeVar150 );
	nodeVar146 = nodeVar151;
	nodeVar152 = ( vec3<f32>( 1.0 ) - SpecularColor );
	nodeVar153 = nodeVar152;
	nodeVar154 = ( nodeVar153 * vec3<f32>( 0.047619 ) );
	nodeVar155 = ( SpecularColor + nodeVar154 );
	nodeVar156 = ( nodeVar150 * nodeVar155 );
	nodeVar157 = ( dfg.x + dfg.y );
	nodeVar158 = ( 1.0 - nodeVar157 );
	nodeVar159 = nodeVar158;
	nodeVar160 = ( vec3<f32>( nodeVar159 ) * nodeVar155 );
	nodeVar161 = ( vec3<f32>( 1.0 ) - nodeVar160 );
	nodeVar162 = nodeVar161;
	nodeVar163 = ( nodeVar156 / nodeVar162 );
	nodeVar164 = ( nodeVar163 * vec3<f32>( nodeVar159 ) );
	nodeVar165 = ( nodeVar147 + nodeVar164 );
	nodeVar147 = nodeVar165;
	nodeVar166 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar167 = ( irradiance * nodeVar166 );
	nodeVar168 = ( nodeVar146 + nodeVar147 );
	nodeVar169 = ( vec3<f32>( 1.0 ) - nodeVar168 );
	nodeVar170 = nodeVar169;
	nodeVar171 = ( nodeVar167 * nodeVar170 );
	nodeVar172 = nodeVar171;
	indirectDiffuse = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar173 = ( indirectDiffuse + nodeVar172 );
	indirectDiffuse = nodeVar173;
	singleScatteringDielectric = vec3<f32>( 0.0, 0.0, 0.0 );
	multiScatteringDielectric = vec3<f32>( 0.0, 0.0, 0.0 );
	singleScatteringMetallic = vec3<f32>( 0.0, 0.0, 0.0 );
	multiScatteringMetallic = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar174 = ( SpecularColor * vec3<f32>( dfg.x ) );
	nodeVar175 = ( SpecularF90 * dfg.y );
	nodeVar176 = ( nodeVar174 + vec3<f32>( nodeVar175 ) );
	nodeVar177 = ( singleScatteringDielectric + nodeVar176 );
	singleScatteringDielectric = nodeVar177;
	nodeVar178 = ( vec3<f32>( 1.0 ) - SpecularColor );
	nodeVar179 = nodeVar178;
	nodeVar180 = ( nodeVar179 * vec3<f32>( 0.047619 ) );
	nodeVar181 = ( SpecularColor + nodeVar180 );
	nodeVar182 = ( nodeVar176 * nodeVar181 );
	nodeVar183 = ( dfg.x + dfg.y );
	nodeVar184 = ( 1.0 - nodeVar183 );
	nodeVar185 = nodeVar184;
	nodeVar186 = ( vec3<f32>( nodeVar185 ) * nodeVar181 );
	nodeVar187 = ( vec3<f32>( 1.0 ) - nodeVar186 );
	nodeVar188 = nodeVar187;
	nodeVar189 = ( nodeVar182 / nodeVar188 );
	nodeVar190 = ( nodeVar189 * vec3<f32>( nodeVar185 ) );
	nodeVar191 = ( multiScatteringDielectric + nodeVar190 );
	multiScatteringDielectric = nodeVar191;
	nodeVar192 = ( DiffuseColor.xyz * vec3<f32>( dfg.x ) );
	nodeVar193 = ( SpecularF90 * dfg.y );
	nodeVar194 = ( nodeVar192 + vec3<f32>( nodeVar193 ) );
	nodeVar195 = ( singleScatteringMetallic + nodeVar194 );
	singleScatteringMetallic = nodeVar195;
	nodeVar196 = ( vec3<f32>( 1.0 ) - DiffuseColor.xyz );
	nodeVar197 = nodeVar196;
	nodeVar198 = ( nodeVar197 * vec3<f32>( 0.047619 ) );
	nodeVar199 = ( DiffuseColor.xyz + nodeVar198 );
	nodeVar200 = ( nodeVar194 * nodeVar199 );
	nodeVar201 = ( dfg.x + dfg.y );
	nodeVar202 = ( 1.0 - nodeVar201 );
	nodeVar203 = nodeVar202;
	nodeVar204 = ( vec3<f32>( nodeVar203 ) * nodeVar199 );
	nodeVar205 = ( vec3<f32>( 1.0 ) - nodeVar204 );
	nodeVar206 = nodeVar205;
	nodeVar207 = ( nodeVar200 / nodeVar206 );
	nodeVar208 = ( nodeVar207 * vec3<f32>( nodeVar203 ) );
	nodeVar209 = ( multiScatteringMetallic + nodeVar208 );
	multiScatteringMetallic = nodeVar209;
	radiance = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar210 = mix( singleScatteringDielectric, singleScatteringMetallic, Metalness );
	nodeVar211 = ( radiance * nodeVar210 );
	nodeVar212 = mix( multiScatteringDielectric, multiScatteringMetallic, Metalness );
	iblIrradiance = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar213 = ( iblIrradiance * vec3<f32>( 0.3183098861837907 ) );
	nodeVar214 = ( nodeVar212 * nodeVar213 );
	nodeVar215 = ( nodeVar211 + nodeVar214 );
	nodeVar216 = nodeVar215;
	nodeVar217 = ( singleScatteringDielectric + multiScatteringDielectric );
	nodeVar218 = ( vec3<f32>( 1.0 ) - nodeVar217 );
	nodeVar219 = nodeVar218;
	nodeVar220 = ( DiffuseContribution * nodeVar219 );
	nodeVar221 = ( nodeVar220 * nodeVar213 );
	nodeVar222 = nodeVar221;
	indirectSpecular = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar223 = ( indirectSpecular + nodeVar216 );
	indirectSpecular = nodeVar223;
	nodeVar224 = ( indirectDiffuse + nodeVar222 );
	indirectDiffuse = nodeVar224;
	ambientOcclusion = 1.0;
	nodeVar225 = ( indirectDiffuse * vec3<f32>( ambientOcclusion ) );
	indirectDiffuse = nodeVar225;
	nodeVar226 = dot( normalView, positionViewDirection );
	nodeVar227 = ( clamp( nodeVar226, 0.0, 1.0 ) + ambientOcclusion );
	nodeVar228 = ( Roughness * -16.0 );
	nodeVar229 = ( 1.0 - nodeVar228 );
	nodeVar230 = nodeVar229;
	nodeVar231 = ( - nodeVar230 );
	nodeVar232 = exp2( nodeVar231 );
	nodeVar233 = pow( nodeVar227, nodeVar232 );
	nodeVar234 = ( 1.0 - nodeVar233 );
	nodeVar235 = nodeVar234;
	nodeVar236 = ( ambientOcclusion - nodeVar235 );
	nodeVar237 = ( indirectSpecular * vec3<f32>( clamp( nodeVar236, 0.0, 1.0 ) ) );
	indirectSpecular = nodeVar237;
	nodeVar238 = ( directDiffuse + indirectDiffuse );
	totalDiffuse = nodeVar238;
	nodeVar239 = ( directSpecular + indirectSpecular );
	totalSpecular = nodeVar239;
	nodeVar240 = ( totalDiffuse + totalSpecular );
	outgoingLight = nodeVar240;
	Output = max( vec4<f32>( ( outgoingLight + EmissiveColor ), DiffuseColor.w ), vec4<f32>( 0.0 ) );
	nodeVar241 = ( - v_positionView.z );
	let nodeConst0 = max( ( 3.0 - v_positionWorld.y ), 0.0 );
	let nodeConst1 = ( nodeConst0 * ( - v_positionView.z ) );
	nodeVar242 = vec4<f32>( mix( Output.xyz, mix( object.nodeUniform43, object.nodeUniform44, pow( clamp( dot( normalize( ( v_positionWorld - render.cameraPosition ) ), object.nodeUniform45 ), 0.0, 1.0 ), 2.5 ) ), ( 1.0 - ( ( 1.0 - ( 1.0 - exp( ( - ( ( ( object.nodeUniform46 * object.nodeUniform46 ) * nodeVar241 ) * nodeVar241 ) ) ) ) ) * ( 1.0 - ( 1.0 - exp( ( - ( ( ( 0.0025 * 0.0025 ) * nodeConst1 ) * nodeConst1 ) ) ) ) ) ) ) ), Output.w );
	Output = nodeVar242;

	// result

	output.color = nodeVar242;

	return output;

}
