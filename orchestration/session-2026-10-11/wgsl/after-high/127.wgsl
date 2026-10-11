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
@binding( 5 ) @group( 1 ) var nodeUniform15_sampler : sampler;
@binding( 6 ) @group( 1 ) var nodeUniform15 : texture_2d<f32>;
@binding( 7 ) @group( 1 ) var nodeUniform23_sampler : sampler;
@binding( 8 ) @group( 1 ) var nodeUniform23 : texture_2d<f32>;
@binding( 9 ) @group( 1 ) var nodeUniform36_sampler : sampler_comparison;
@binding( 10 ) @group( 1 ) var nodeUniform36 : texture_depth_2d;

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
	nodeUniform16 : mat3x3<f32>,
	nodeUniform17 : vec2<f32>,
	nodeUniform20 : vec3<f32>,
	nodeUniform21 : vec3<f32>,
	nodeUniform22 : f32,
	nodeUniform44 : vec3<f32>,
	nodeUniform45 : vec3<f32>,
	nodeUniform46 : vec3<f32>,
	nodeUniform47 : f32
};
@binding( 2 ) @group( 1 )
var<uniform> object : objectStruct;

struct renderStruct {
	cameraProjectionMatrix : mat4x4<f32>,
	cameraViewMatrix : mat4x4<f32>,
	nodeUniform25 : vec3<f32>,
	nodeUniform26 : vec3<f32>,
	nodeUniform24 : vec3<f32>,
	nodeUniform29 : vec3<f32>,
	nodeUniform32 : vec3<f32>,
	nodeUniform41 : vec3<f32>,
	nodeUniform42 : f32,
	nodeUniform43 : f32,
	nodeUniform27 : vec3<f32>,
	nodeUniform28 : vec3<f32>,
	nodeUniform30 : vec3<f32>,
	nodeUniform31 : vec3<f32>,
	nodeUniform40 : vec3<f32>,
	nodeUniform33 : mat4x4<f32>,
	nodeUniform34 : f32,
	nodeUniform35 : f32,
	nodeUniform39 : f32,
	cameraPosition : vec3<f32>,
	nodeUniform37 : f32,
	nodeUniform38 : vec2<f32>
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
var<private> nodeVar8 : f32;
var<private> nodeVar9 : vec3<f32>;
var<private> nodeVar10 : f32;
var<private> nodeVar11 : f32;
var<private> nodeVar12 : vec2<f32>;
var<private> nodeVar13 : f32;
var<private> nodeVar14 : f32;
var<private> nodeVar15 : f32;
var<private> nodeVar16 : vec3<f32>;
var<private> nodeVar17 : f32;
var<private> Metalness : f32;
var<private> Roughness : f32;
var<private> normalViewGeometry : vec3<f32>;
var<private> nodeVar18 : vec3<f32>;
var<private> SpecularColor : vec3<f32>;
var<private> SpecularColorBlended : vec3<f32>;
var<private> SpecularF90 : f32;
var<private> DiffuseContribution : vec3<f32>;
var<private> EmissiveColor : vec3<f32>;
var<private> nodeVar19 : vec3<f32>;
var<private> nodeVar20 : vec3<f32>;
var<private> nodeVar21 : f32;
var<private> nodeVar22 : f32;
var<private> nodeVar23 : vec2<f32>;
var<private> nodeVar24 : vec3<f32>;
var<private> nodeVar25 : f32;
var<private> nodeVar26 : f32;
var<private> nodeVar27 : vec2<f32>;
var<private> nodeVar28 : f32;
var<private> NORMAL_normalView : vec3<f32>;
var<private> nodeVar29 : vec3<f32>;
var<private> nodeVar30 : vec2<f32>;
var<private> nodeVar31 : vec3<f32>;
var<private> nodeVar32 : vec2<f32>;
var<private> nodeVar33 : vec3<f32>;
var<private> nodeVar34 : f32;
var<private> nodeVar35 : vec3<f32>;
var<private> nodeVar36 : f32;
var<private> tangentViewFrame : vec3<f32>;
var<private> NORMAL_tangentView : vec3<f32>;
var<private> bitangentViewFrame : vec3<f32>;
var<private> NORMAL_bitangentView : vec3<f32>;
var<private> NORMAL_TBNViewMatrix : mat3x3<f32>;
var<private> nodeVar37 : vec4<f32>;
var<private> nodeVar38 : vec4<f32>;
var<private> normalView : vec3<f32>;
var<private> normalWorld : vec3<f32>;
var<private> nodeVar39 : vec3<f32>;
var<private> nodeVar40 : vec3<f32>;
var<private> nodeVar41 : f32;
var<private> nodeVar42 : f32;
var<private> nodeVar43 : f32;
var<private> Output : vec4<f32>;
var<private> positionViewDirection : vec3<f32>;
var<private> nodeVar44 : f32;
var<private> nodeVar45 : vec2<f32>;
var<private> nodeVar46 : f32;
var<private> nodeVar47 : f32;
var<private> nodeVar48 : f32;
var<private> nodeVar49 : f32;
var<private> nodeVar50 : vec3<f32>;
var<private> nodeVar51 : vec3<f32>;
var<private> irradiance : vec3<f32>;
var<private> nodeVar52 : f32;
var<private> nodeVar53 : f32;
var<private> nodeVar54 : f32;
var<private> nodeVar55 : vec3<f32>;
var<private> nodeVar56 : vec3<f32>;
var<private> nodeVar57 : vec3<f32>;
var<private> nodeVar58 : vec4<f32>;
var<private> nodeVar59 : vec4<f32>;
var<private> nodeVar60 : vec3<f32>;
var<private> nodeVar61 : vec3<f32>;
var<private> nodeVar62 : f32;
var<private> nodeVar63 : vec3<f32>;
var<private> nodeVar64 : vec3<f32>;
var<private> directDiffuse : vec3<f32>;
var<private> nodeVar65 : vec3<f32>;
var<private> nodeVar66 : vec3<f32>;
var<private> nodeVar67 : vec3<f32>;
var<private> nodeVar68 : vec3<f32>;
var<private> nodeVar69 : f32;
var<private> nodeVar70 : f32;
var<private> nodeVar71 : f32;
var<private> nodeVar72 : vec3<f32>;
var<private> nodeVar73 : vec3<f32>;
var<private> nodeVar74 : vec3<f32>;
var<private> nodeVar75 : vec3<f32>;
var<private> nodeVar76 : vec3<f32>;
var<private> directSpecular : vec3<f32>;
var<private> nodeVar77 : vec3<f32>;
var<private> nodeVar78 : f32;
var<private> nodeVar79 : f32;
var<private> nodeVar80 : f32;
var<private> nodeVar81 : vec3<f32>;
var<private> nodeVar82 : vec3<f32>;
var<private> nodeVar83 : vec3<f32>;
var<private> nodeVar84 : vec3<f32>;
var<private> nodeVar85 : vec3<f32>;
var<private> nodeVar86 : vec4<f32>;
var<private> nodeVar87 : vec4<f32>;
var<private> nodeVar88 : vec3<f32>;
var<private> nodeVar89 : vec3<f32>;
var<private> nodeVar90 : f32;
var<private> shadowPositionWorld : vec3<f32>;
var<private> nodeVar91 : f32;
var<private> nodeVar92 : vec4<f32>;
var<private> nodeVar93 : vec3<f32>;
var<private> nodeVar94 : vec3<f32>;
var<private> nodeVar95 : f32;
var<private> nodeVar96 : f32;
var<private> nodeVar97 : vec2<f32>;
var<private> nodeVar98 : f32;
var<private> nodeVar99 : vec2<f32>;
var<private> nodeVar100 : f32;
var<private> nodeVar101 : vec2<f32>;
var<private> nodeVar102 : f32;
var<private> nodeVar103 : vec2<f32>;
var<private> nodeVar104 : f32;
var<private> nodeVar105 : vec2<f32>;
var<private> nodeVar106 : f32;
var<private> nodeVar107 : f32;
var<private> nodeVar108 : vec3<f32>;
var<private> nodeVar109 : vec3<f32>;
var<private> nodeVar110 : vec3<f32>;
var<private> nodeVar111 : vec3<f32>;
var<private> nodeVar112 : vec3<f32>;
var<private> nodeVar113 : vec3<f32>;
var<private> nodeVar114 : f32;
var<private> nodeVar115 : f32;
var<private> nodeVar116 : f32;
var<private> nodeVar117 : vec3<f32>;
var<private> nodeVar118 : vec3<f32>;
var<private> nodeVar119 : vec3<f32>;
var<private> nodeVar120 : vec3<f32>;
var<private> nodeVar121 : vec3<f32>;
var<private> nodeVar122 : vec3<f32>;
var<private> nodeVar123 : f32;
var<private> nodeVar124 : f32;
var<private> nodeVar125 : f32;
var<private> nodeVar126 : vec3<f32>;
var<private> nodeVar127 : vec3<f32>;
var<private> nodeVar128 : vec3<f32>;
var<private> nodeVar129 : vec3<f32>;
var<private> nodeVar130 : vec3<f32>;
var<private> nodeVar131 : vec3<f32>;
var<private> nodeVar132 : f32;
var<private> nodeVar133 : f32;
var<private> nodeVar134 : f32;
var<private> nodeVar135 : f32;
var<private> nodeVar136 : f32;
var<private> nodeVar137 : vec3<f32>;
var<private> nodeVar138 : vec3<f32>;
var<private> nodeVar139 : vec3<f32>;
var<private> nodeVar140 : vec3<f32>;
var<private> nodeVar141 : vec3<f32>;
var<private> nodeVar142 : vec3<f32>;
var<private> nodeVar143 : vec3<f32>;
var<private> nodeVar144 : f32;
var<private> nodeVar145 : f32;
var<private> nodeVar146 : f32;
var<private> nodeVar147 : vec3<f32>;
var<private> nodeVar148 : vec3<f32>;
var<private> nodeVar149 : vec3<f32>;
var<private> nodeVar150 : vec3<f32>;
var<private> nodeVar151 : vec3<f32>;
var<private> nodeVar152 : vec3<f32>;
var<private> nodeVar153 : f32;
var<private> nodeVar154 : f32;
var<private> nodeVar155 : f32;
var<private> nodeVar156 : vec3<f32>;
var<private> nodeVar157 : vec3<f32>;
var<private> nodeVar158 : vec3<f32>;
var<private> nodeVar159 : vec3<f32>;
var<private> nodeVar160 : vec3<f32>;
var<private> nodeVar161 : vec3<f32>;
var<private> nodeVar162 : vec3<f32>;
var<private> nodeVar163 : f32;
var<private> nodeVar164 : vec3<f32>;
var<private> nodeVar165 : vec3<f32>;
var<private> nodeVar166 : vec3<f32>;
var<private> nodeVar167 : vec3<f32>;
var<private> nodeVar168 : vec3<f32>;
var<private> nodeVar169 : vec3<f32>;
var<private> nodeVar170 : vec3<f32>;
var<private> nodeVar171 : f32;
var<private> nodeVar172 : f32;
var<private> nodeVar173 : f32;
var<private> nodeVar174 : vec3<f32>;
var<private> nodeVar175 : vec3<f32>;
var<private> nodeVar176 : vec3<f32>;
var<private> nodeVar177 : vec3<f32>;
var<private> nodeVar178 : vec3<f32>;
var<private> nodeVar179 : vec3<f32>;
var<private> nodeVar180 : vec3<f32>;
var<private> nodeVar181 : vec3<f32>;
var<private> nodeVar182 : vec3<f32>;
var<private> nodeVar183 : vec3<f32>;
var<private> nodeVar184 : vec3<f32>;
var<private> nodeVar185 : vec3<f32>;
var<private> nodeVar186 : vec3<f32>;
var<private> indirectDiffuse : vec3<f32>;
var<private> nodeVar187 : vec3<f32>;
var<private> singleScatteringDielectric : vec3<f32>;
var<private> multiScatteringDielectric : vec3<f32>;
var<private> singleScatteringMetallic : vec3<f32>;
var<private> multiScatteringMetallic : vec3<f32>;
var<private> nodeVar188 : vec3<f32>;
var<private> nodeVar189 : f32;
var<private> nodeVar190 : vec3<f32>;
var<private> nodeVar191 : vec3<f32>;
var<private> nodeVar192 : vec3<f32>;
var<private> nodeVar193 : vec3<f32>;
var<private> nodeVar194 : vec3<f32>;
var<private> nodeVar195 : vec3<f32>;
var<private> nodeVar196 : vec3<f32>;
var<private> nodeVar197 : f32;
var<private> nodeVar198 : f32;
var<private> nodeVar199 : f32;
var<private> nodeVar200 : vec3<f32>;
var<private> nodeVar201 : vec3<f32>;
var<private> nodeVar202 : vec3<f32>;
var<private> nodeVar203 : vec3<f32>;
var<private> nodeVar204 : vec3<f32>;
var<private> nodeVar205 : vec3<f32>;
var<private> nodeVar206 : vec3<f32>;
var<private> nodeVar207 : f32;
var<private> nodeVar208 : vec3<f32>;
var<private> nodeVar209 : vec3<f32>;
var<private> nodeVar210 : vec3<f32>;
var<private> nodeVar211 : vec3<f32>;
var<private> nodeVar212 : vec3<f32>;
var<private> nodeVar213 : vec3<f32>;
var<private> nodeVar214 : vec3<f32>;
var<private> nodeVar215 : f32;
var<private> nodeVar216 : f32;
var<private> nodeVar217 : f32;
var<private> nodeVar218 : vec3<f32>;
var<private> nodeVar219 : vec3<f32>;
var<private> nodeVar220 : vec3<f32>;
var<private> nodeVar221 : vec3<f32>;
var<private> nodeVar222 : vec3<f32>;
var<private> nodeVar223 : vec3<f32>;
var<private> radiance : vec3<f32>;
var<private> nodeVar224 : vec3<f32>;
var<private> nodeVar225 : vec3<f32>;
var<private> nodeVar226 : vec3<f32>;
var<private> iblIrradiance : vec3<f32>;
var<private> nodeVar227 : vec3<f32>;
var<private> nodeVar228 : vec3<f32>;
var<private> nodeVar229 : vec3<f32>;
var<private> nodeVar230 : vec3<f32>;
var<private> nodeVar231 : vec3<f32>;
var<private> nodeVar232 : vec3<f32>;
var<private> nodeVar233 : vec3<f32>;
var<private> nodeVar234 : vec3<f32>;
var<private> nodeVar235 : vec3<f32>;
var<private> nodeVar236 : vec3<f32>;
var<private> indirectSpecular : vec3<f32>;
var<private> nodeVar237 : vec3<f32>;
var<private> nodeVar238 : vec3<f32>;
var<private> ambientOcclusion : f32;
var<private> nodeVar239 : vec3<f32>;
var<private> nodeVar240 : f32;
var<private> nodeVar241 : f32;
var<private> nodeVar242 : f32;
var<private> nodeVar243 : f32;
var<private> nodeVar244 : f32;
var<private> nodeVar245 : f32;
var<private> nodeVar246 : f32;
var<private> nodeVar247 : f32;
var<private> nodeVar248 : f32;
var<private> nodeVar249 : f32;
var<private> nodeVar250 : f32;
var<private> nodeVar251 : vec3<f32>;
var<private> totalDiffuse : vec3<f32>;
var<private> nodeVar252 : vec3<f32>;
var<private> totalSpecular : vec3<f32>;
var<private> nodeVar253 : vec3<f32>;
var<private> outgoingLight : vec3<f32>;
var<private> nodeVar254 : vec3<f32>;
var<private> nodeVar255 : f32;
var<private> nodeVar256 : vec4<f32>;

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
	@location( 5 ) nodeVarying7 : vec2<f32>,
	@builtin( position ) fragCoord : vec4<f32> ) -> OutputStruct {

	// flow
	// code

	nodeVar1 = textureSample( nodeUniform3, nodeUniform3_sampler, ( object.nodeUniform4 * vec3<f32>( nodeVarying7, 1.0 ) ).xy );
	nodeVar2 = dot( ( nodeVar1.xyz * vec3<f32>( 0.78, 0.85, 1.0 ) ), vec3<f32>( 0.2126, 0.7152, 0.0722 ) );
	nodeVar3 = fract( ( ( vec3<f32>( ( nodeVarying7 * vec2<f32>( 11.0 ) ), 0.37 ) + vec3<f32>( 3.7 ) ) / vec3<f32>( 8.0 ) ) );
	nodeVar4 = ( nodeVar3.z * 64.0 );
	nodeVar5 = floor( nodeVar4 );
	nodeVar6 = textureSample( nodeUniform5, nodeUniform5_sampler, ( ( ( ( vec2<f32>( tsl_mod_float( nodeVar5, 8.0 ), floor( ( nodeVar5 / 8.0 ) ) ) * vec2<f32>( 66.0 ) ) + ( nodeVar3.xy * vec2<f32>( 64.0 ) ) ) + vec2<f32>( 1.5 ) ) / vec2<f32>( 528.0 ) ) ).xy;
	nodeVar7 = smoothstep( -0.25, 0.35, mix( nodeVar6.x, nodeVar6.y, ( nodeVar4 - nodeVar5 ) ) );
	nodeVar8 = mix( -0.11, 1.01, object.nodeUniform6 );
	nodeVar9 = fract( ( ( v_positionWorld * vec3<f32>( 4.2 ) ) / vec3<f32>( 8.0 ) ) );
	nodeVar10 = ( nodeVar9.z * 64.0 );
	nodeVar11 = floor( nodeVar10 );
	nodeVar12 = textureSample( nodeUniform5, nodeUniform5_sampler, ( ( ( ( vec2<f32>( tsl_mod_float( nodeVar11, 8.0 ), floor( ( nodeVar11 / 8.0 ) ) ) * vec2<f32>( 66.0 ) ) + ( nodeVar9.xy * vec2<f32>( 64.0 ) ) ) + vec2<f32>( 1.5 ) ) / vec2<f32>( 528.0 ) ) ).xy;
	nodeVar13 = clamp( ( ( mix( nodeVar12.x, nodeVar12.y, ( nodeVar10 - nodeVar11 ) ) * 0.9 ) + 0.5 ), 0.0, 1.0 );
	nodeVar14 = ( 1.0 - smoothstep( nodeVar8, ( nodeVar8 + 0.1 ), nodeVar13 ) );
	nodeVar15 = ( nodeVar14 * nodeVar14 );
	nodeVar16 = mix( mix( ( vec3<f32>( 0.17, 0.16, 0.15 ) * vec3<f32>( ( ( nodeVar2 * 0.8 ) + 0.5 ) ) ), ( vec3<f32>( 0.14412847084818123, 0.06847816983662762, 0.0343398068028541 ) * vec3<f32>( ( ( nodeVar2 * 0.9 ) + 0.35 ) ) ), nodeVar7 ), vec3<f32>( 0.007499032040460618, 0.005605391621829108, 0.004776953478513362 ), ( nodeVar15 * 0.9 ) );
	DiffuseColor = vec4<f32>( nodeVar16, 1.0 );

	if ( ( nodeVar13 > nodeVar8 ) ) {

		nodeVar17 = 1.0;

	} else {

		nodeVar17 = 0.0;

	}

	DiffuseColor.w = ( DiffuseColor.w * nodeVar17 );

	if ( ( DiffuseColor.w <= object.nodeUniform8 ) ) {

		discard;
		

	}

	DiffuseColor.w = 1.0;
	Metalness = object.nodeUniform9;
	normalViewGeometry = normalize( v_normalViewGeometry );
	nodeVar18 = max( abs( dpdx( normalViewGeometry ) ), abs( - dpdy( normalViewGeometry ) ) );
	Roughness = min( ( max( object.nodeUniform10, 0.0525 ) + max( max( nodeVar18.x, nodeVar18.y ), nodeVar18.z ) ), 1.0 );
	SpecularColor = vec3<f32>( 0.04, 0.04, 0.04 );
	SpecularColorBlended = mix( vec3<f32>( 0.04, 0.04, 0.04 ), DiffuseColor.xyz, Metalness );
	SpecularF90 = 1.0;
	DiffuseContribution = ( DiffuseColor.xyz * vec3<f32>( ( 1.0 - object.nodeUniform9 ) ) );
	nodeVar19 = ( positionLocal * vec3<f32>( 14.0 ) );
	nodeVar20 = fract( ( nodeVar19 / vec3<f32>( 8.0 ) ) );
	nodeVar21 = ( nodeVar20.z * 64.0 );
	nodeVar22 = floor( nodeVar21 );
	nodeVar23 = textureSample( nodeUniform5, nodeUniform5_sampler, ( ( ( ( vec2<f32>( tsl_mod_float( nodeVar22, 8.0 ), floor( ( nodeVar22 / 8.0 ) ) ) * vec2<f32>( 66.0 ) ) + ( nodeVar20.xy * vec2<f32>( 64.0 ) ) ) + vec2<f32>( 1.5 ) ) / vec2<f32>( 528.0 ) ) ).xy;
	nodeVar24 = fract( ( ( ( nodeVar19 * vec3<f32>( 0.23 ) ) + vec3<f32>( 7.3 ) ) / vec3<f32>( 8.0 ) ) );
	nodeVar25 = ( nodeVar24.z * 64.0 );
	nodeVar26 = floor( nodeVar25 );
	nodeVar27 = textureSample( nodeUniform5, nodeUniform5_sampler, ( ( ( ( vec2<f32>( tsl_mod_float( nodeVar26, 8.0 ), floor( ( nodeVar26 / 8.0 ) ) ) * vec2<f32>( 66.0 ) ) + ( nodeVar24.xy * vec2<f32>( 64.0 ) ) ) + vec2<f32>( 1.5 ) ) / vec2<f32>( 528.0 ) ) ).xy;

	if ( ( object.nodeUniform6 > 0.0 ) ) {

		nodeVar28 = 3.2;

	} else {

		nodeVar28 = 0.0;

	}

	NORMAL_normalView = normalViewGeometry;
	nodeVar29 = cross( - dpdy( v_positionView ), NORMAL_normalView );
	nodeVar30 = dpdx( nodeVarying7 );
	nodeVar31 = cross( NORMAL_normalView, dpdx( v_positionView ) );
	nodeVar32 = - dpdy( nodeVarying7 );
	nodeVar33 = ( ( nodeVar29 * vec3<f32>( nodeVar30.x ) ) + ( nodeVar31 * vec3<f32>( nodeVar32.x ) ) );
	nodeVar35 = ( ( nodeVar29 * vec3<f32>( nodeVar30.y ) ) + ( nodeVar31 * vec3<f32>( nodeVar32.y ) ) );
	nodeVar36 = max( dot( nodeVar33, nodeVar33 ), dot( nodeVar35, nodeVar35 ) );

	if ( ( nodeVar36 == 0.0 ) ) {

		nodeVar34 = 0.0;

	} else {

		nodeVar34 = inverseSqrt( nodeVar36 );

	}

	tangentViewFrame = ( nodeVar33 * vec3<f32>( nodeVar34 ) );
	NORMAL_tangentView = tangentViewFrame;
	bitangentViewFrame = ( nodeVar35 * nodeVar34 );
	NORMAL_bitangentView = bitangentViewFrame;
	NORMAL_TBNViewMatrix = mat3x3<f32>( NORMAL_tangentView, NORMAL_bitangentView, NORMAL_normalView );
	nodeVar37 = textureSample( nodeUniform15, nodeUniform15_sampler, ( object.nodeUniform16 * vec3<f32>( nodeVarying7, 1.0 ) ).xy );
	nodeVar38 = ( ( nodeVar37 * vec4<f32>( 2.0 ) ) - vec4<f32>( 1.0 ) );
	normalView = normalize( ( NORMAL_TBNViewMatrix * vec3<f32>( ( nodeVar38.xy * object.nodeUniform17 ), nodeVar38.z ) ) );
	normalWorld = normalize( ( vec4<f32>( normalView, 0.0 ) * render.cameraViewMatrix ).xyz );
	nodeVar39 = normalize( normalWorld );
	nodeVar40 = normalize( ( render.cameraPosition - v_positionWorld ) );
	nodeVar41 = pow( ( 1.0 - clamp( dot( nodeVar39, nodeVar40 ), 0.0, 1.0 ) ), 3.0 );
	nodeVar42 = smoothstep( -0.35, 0.55, dot( nodeVar39, object.nodeUniform20 ) );
	nodeVar43 = smoothstep( -0.15, 0.85, ( - dot( nodeVar40, object.nodeUniform20 ) ) );
	EmissiveColor = ( ( ( ( vec3<f32>( 1.0, 0.10224173307914941, 0.0069954101845983935 ) * vec3<f32>( object.nodeUniform13 ) ) * vec3<f32>( ( ( ( ( ( 1.0 - smoothstep( 0.0, 0.032, abs( mix( nodeVar23.x, nodeVar23.y, ( nodeVar21 - nodeVar22 ) ) ) ) ) * smoothstep( 0.05, 0.5, mix( nodeVar27.x, nodeVar27.y, ( nodeVar25 - nodeVar26 ) ) ) ) * 1.1 ) + 0.0 ) + ( ( 1.0 - nodeVar7 ) * 0.03 ) ) ) ) + ( ( vec3<f32>( 1.0, 0.10224173307914941, 0.0069954101845983935 ) * vec3<f32>( smoothstep( 0.35, 1.0, nodeVar14 ) ) ) * vec3<f32>( nodeVar28 ) ) ) + ( mix( vec3<f32>( 0.0, 0.0, 0.0 ), ( ( ( ( ( object.nodeUniform14 * vec3<f32>( nodeVar41 ) ) * vec3<f32>( nodeVar42 ) ) * vec3<f32>( ( ( nodeVar43 * 1.38 ) + 0.12 ) ) ) + ( ( ( object.nodeUniform21 * vec3<f32>( nodeVar41 ) ) * vec3<f32>( ( 1.0 - ( nodeVar42 * nodeVar43 ) ) ) ) * vec3<f32>( 0.18 ) ) ) + ( ( ( nodeVar16 * vec3<f32>( 0.07 ) ) * vec3<f32>( ( 1.0 - ( smoothstep( 0.0, 0.5, dot( nodeVar16, vec3<f32>( 0.299, 0.587, 0.114 ) ) ) * 0.6 ) ) ) ) + vec3<f32>( 0.006, 0.0055, 0.005 ) ) ), object.nodeUniform22 ) * vec3<f32>( ( 1.0 - nodeVar15 ) ) ) );
	positionViewDirection = normalize( v_positionViewDirection );
	nodeVar44 = dot( normalView, positionViewDirection );
	nodeVar45 = textureSample( nodeUniform23, nodeUniform23_sampler, vec2<f32>( Roughness, clamp( nodeVar44, 0.0, 1.0 ) ) ).xy;
	let dfg = nodeVar45;
	nodeVar46 = ( dfg.x + dfg.y );
	nodeVar47 = ( 1.0 / nodeVar46 );
	nodeVar48 = nodeVar47;
	nodeVar49 = ( nodeVar48 - 1.0 );
	nodeVar50 = ( SpecularColorBlended * vec3<f32>( nodeVar49 ) );
	nodeVar51 = ( nodeVar50 + vec3<f32>( 1.0 ) );
	let multiScatteringCompensation = nodeVar51;
	irradiance = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar52 = dot( normalWorld, normalize( render.nodeUniform26 ) );
	nodeVar53 = ( nodeVar52 * 0.5 );
	nodeVar54 = ( nodeVar53 + 0.5 );
	nodeVar55 = mix( render.nodeUniform24, render.nodeUniform25, nodeVar54 );
	nodeVar56 = ( irradiance + nodeVar55 );
	irradiance = nodeVar56;
	nodeVar57 = ( render.nodeUniform27 - render.nodeUniform28 );
	nodeVar58 = vec4<f32>( nodeVar57, 0.0 );
	nodeVar59 = ( render.cameraViewMatrix * nodeVar58 );
	nodeVar60 = normalize( nodeVar59.xyz );
	nodeVar61 = nodeVar60;
	nodeVar62 = dot( normalView, nodeVar61 );
	nodeVar63 = ( vec3<f32>( clamp( nodeVar62, 0.0, 1.0 ) ) * render.nodeUniform29 );
	nodeVar64 = nodeVar63;
	directDiffuse = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar65 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar66 = ( nodeVar64 * nodeVar65 );
	nodeVar67 = ( nodeVar61 + positionViewDirection );
	nodeVar68 = normalize( nodeVar67 );
	nodeVar69 = dot( positionViewDirection, nodeVar68 );
	nodeVar70 = clamp( nodeVar69, 0.0, 1.0 );
	nodeVar71 = exp2( ( ( ( nodeVar70 * -5.55473 ) - 6.98316 ) * nodeVar70 ) );
	nodeVar72 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar71 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar71 ) ) );
	nodeVar73 = ( vec3<f32>( 1.0 ) - nodeVar72 );
	nodeVar74 = nodeVar73;
	nodeVar75 = ( nodeVar66 * nodeVar74 );
	nodeVar76 = ( directDiffuse + nodeVar75 );
	directDiffuse = nodeVar76;
	directSpecular = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar77 = normalize( ( nodeVar61 + positionViewDirection ) );
	nodeVar78 = clamp( dot( positionViewDirection, nodeVar77 ), 0.0, 1.0 );
	nodeVar79 = exp2( ( ( ( nodeVar78 * -5.55473 ) - 6.98316 ) * nodeVar78 ) );
	nodeVar80 = ( Roughness * Roughness );
	nodeVar81 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar79 ) ) ) + vec3<f32>( ( 1.0 * nodeVar79 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar80, clamp( dot( normalView, nodeVar61 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar80, clamp( dot( normalView, nodeVar77 ), 0.0, 1.0 ) ) ) );
	nodeVar82 = ( nodeVar64 * nodeVar81 );
	nodeVar83 = ( nodeVar82 * multiScatteringCompensation );
	nodeVar84 = ( directSpecular + nodeVar83 );
	directSpecular = nodeVar84;
	nodeVar85 = ( render.nodeUniform30 - render.nodeUniform31 );
	nodeVar86 = vec4<f32>( nodeVar85, 0.0 );
	nodeVar87 = ( render.cameraViewMatrix * nodeVar86 );
	nodeVar88 = normalize( nodeVar87.xyz );
	nodeVar89 = nodeVar88;
	nodeVar90 = dot( normalView, nodeVar89 );
	shadowPositionWorld = v_positionWorld;
	nodeVar92 = ( render.nodeUniform33 * vec4<f32>( ( shadowPositionWorld + ( normalWorld * vec3<f32>( render.nodeUniform34 ) ) ), 1.0 ) );
	nodeVar93 = ( nodeVar92.xyz / vec3<f32>( nodeVar92.w ) );
	nodeVar94 = vec3<f32>( nodeVar93.x, ( 1.0 - nodeVar93.y ), ( nodeVar93.z + render.nodeUniform35 ) );

	if ( ( ( ( ( ( nodeVar94.x >= 0.0 ) && ( nodeVar94.x <= 1.0 ) ) && ( nodeVar94.y >= 0.0 ) ) && ( nodeVar94.y <= 1.0 ) ) && ( nodeVar94.z <= 1.0 ) ) ) {

		nodeVar95 = ( interleavedGradientNoise( fragCoord.xy ) * 6.28318530718 );
		nodeVar96 = ( render.nodeUniform37 * ( vec2<f32>( 1.0, 1.0 ) / render.nodeUniform38 ).x );
		nodeVar97 = ( nodeVar94.xy + ( vogelDiskSample( 0, 5, nodeVar95 ) * vec2<f32>( nodeVar96 ) ) );
		nodeVar98 = textureSampleCompare( nodeUniform36, nodeUniform36_sampler, nodeVar97, nodeVar94.z );
		nodeVar99 = ( nodeVar94.xy + ( vogelDiskSample( 1, 5, nodeVar95 ) * vec2<f32>( nodeVar96 ) ) );
		nodeVar100 = textureSampleCompare( nodeUniform36, nodeUniform36_sampler, nodeVar99, nodeVar94.z );
		nodeVar101 = ( nodeVar94.xy + ( vogelDiskSample( 2, 5, nodeVar95 ) * vec2<f32>( nodeVar96 ) ) );
		nodeVar102 = textureSampleCompare( nodeUniform36, nodeUniform36_sampler, nodeVar101, nodeVar94.z );
		nodeVar103 = ( nodeVar94.xy + ( vogelDiskSample( 3, 5, nodeVar95 ) * vec2<f32>( nodeVar96 ) ) );
		nodeVar104 = textureSampleCompare( nodeUniform36, nodeUniform36_sampler, nodeVar103, nodeVar94.z );
		nodeVar105 = ( nodeVar94.xy + ( vogelDiskSample( 4, 5, nodeVar95 ) * vec2<f32>( nodeVar96 ) ) );
		nodeVar106 = textureSampleCompare( nodeUniform36, nodeUniform36_sampler, nodeVar105, nodeVar94.z );
		nodeVar91 = ( ( ( ( ( nodeVar98 + nodeVar100 ) + nodeVar102 ) + nodeVar104 ) + nodeVar106 ) * 0.2 );

	} else {

		nodeVar91 = 1.0;

	}

	nodeVar107 = mix( 1.0, nodeVar91, render.nodeUniform39 );
	nodeVar108 = ( vec3<f32>( clamp( nodeVar90, 0.0, 1.0 ) ) * ( render.nodeUniform32 * vec3<f32>( nodeVar107 ) ) );
	nodeVar109 = nodeVar108;
	nodeVar110 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar111 = ( nodeVar109 * nodeVar110 );
	nodeVar112 = ( nodeVar89 + positionViewDirection );
	nodeVar113 = normalize( nodeVar112 );
	nodeVar114 = dot( positionViewDirection, nodeVar113 );
	nodeVar115 = clamp( nodeVar114, 0.0, 1.0 );
	nodeVar116 = exp2( ( ( ( nodeVar115 * -5.55473 ) - 6.98316 ) * nodeVar115 ) );
	nodeVar117 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar116 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar116 ) ) );
	nodeVar118 = ( vec3<f32>( 1.0 ) - nodeVar117 );
	nodeVar119 = nodeVar118;
	nodeVar120 = ( nodeVar111 * nodeVar119 );
	nodeVar121 = ( directDiffuse + nodeVar120 );
	directDiffuse = nodeVar121;
	nodeVar122 = normalize( ( nodeVar89 + positionViewDirection ) );
	nodeVar123 = clamp( dot( positionViewDirection, nodeVar122 ), 0.0, 1.0 );
	nodeVar124 = exp2( ( ( ( nodeVar123 * -5.55473 ) - 6.98316 ) * nodeVar123 ) );
	nodeVar125 = ( Roughness * Roughness );
	nodeVar126 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar124 ) ) ) + vec3<f32>( ( 1.0 * nodeVar124 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar125, clamp( dot( normalView, nodeVar89 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar125, clamp( dot( normalView, nodeVar122 ), 0.0, 1.0 ) ) ) );
	nodeVar127 = ( nodeVar109 * nodeVar126 );
	nodeVar128 = ( nodeVar127 * multiScatteringCompensation );
	nodeVar129 = ( directSpecular + nodeVar128 );
	directSpecular = nodeVar129;
	nodeVar130 = ( render.nodeUniform40 - v_positionView );
	nodeVar131 = normalize( nodeVar130 );
	nodeVar132 = dot( normalView, nodeVar131 );

	if ( ( render.nodeUniform42 > 0.0 ) ) {

		nodeVar134 = length( nodeVar130 );
		nodeVar135 = ( nodeVar134 / render.nodeUniform42 );
		nodeVar136 = clamp( ( 1.0 - ( ( ( nodeVar135 * nodeVar135 ) * nodeVar135 ) * nodeVar135 ) ), 0.0, 1.0 );
		nodeVar133 = ( ( 1.0 / max( pow( nodeVar134, render.nodeUniform43 ), 0.01 ) ) * ( nodeVar136 * nodeVar136 ) );

	} else {

		nodeVar133 = ( 1.0 / max( pow( length( nodeVar130 ), render.nodeUniform43 ), 0.01 ) );

	}

	nodeVar137 = ( render.nodeUniform41 * vec3<f32>( nodeVar133 ) );
	nodeVar138 = ( vec3<f32>( clamp( nodeVar132, 0.0, 1.0 ) ) * nodeVar137 );
	nodeVar139 = nodeVar138;
	nodeVar140 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar141 = ( nodeVar139 * nodeVar140 );
	nodeVar142 = ( nodeVar131 + positionViewDirection );
	nodeVar143 = normalize( nodeVar142 );
	nodeVar144 = dot( positionViewDirection, nodeVar143 );
	nodeVar145 = clamp( nodeVar144, 0.0, 1.0 );
	nodeVar146 = exp2( ( ( ( nodeVar145 * -5.55473 ) - 6.98316 ) * nodeVar145 ) );
	nodeVar147 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar146 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar146 ) ) );
	nodeVar148 = ( vec3<f32>( 1.0 ) - nodeVar147 );
	nodeVar149 = nodeVar148;
	nodeVar150 = ( nodeVar141 * nodeVar149 );
	nodeVar151 = ( directDiffuse + nodeVar150 );
	directDiffuse = nodeVar151;
	nodeVar152 = normalize( ( nodeVar131 + positionViewDirection ) );
	nodeVar153 = clamp( dot( positionViewDirection, nodeVar152 ), 0.0, 1.0 );
	nodeVar154 = exp2( ( ( ( nodeVar153 * -5.55473 ) - 6.98316 ) * nodeVar153 ) );
	nodeVar155 = ( Roughness * Roughness );
	nodeVar156 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar154 ) ) ) + vec3<f32>( ( 1.0 * nodeVar154 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar155, clamp( dot( normalView, nodeVar131 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar155, clamp( dot( normalView, nodeVar152 ), 0.0, 1.0 ) ) ) );
	nodeVar157 = ( nodeVar139 * nodeVar156 );
	nodeVar158 = ( nodeVar157 * multiScatteringCompensation );
	nodeVar159 = ( directSpecular + nodeVar158 );
	directSpecular = nodeVar159;
	nodeVar160 = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar161 = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar162 = ( SpecularColor * vec3<f32>( dfg.x ) );
	nodeVar163 = ( SpecularF90 * dfg.y );
	nodeVar164 = ( nodeVar162 + vec3<f32>( nodeVar163 ) );
	nodeVar165 = ( nodeVar160 + nodeVar164 );
	nodeVar160 = nodeVar165;
	nodeVar166 = ( vec3<f32>( 1.0 ) - SpecularColor );
	nodeVar167 = nodeVar166;
	nodeVar168 = ( nodeVar167 * vec3<f32>( 0.047619 ) );
	nodeVar169 = ( SpecularColor + nodeVar168 );
	nodeVar170 = ( nodeVar164 * nodeVar169 );
	nodeVar171 = ( dfg.x + dfg.y );
	nodeVar172 = ( 1.0 - nodeVar171 );
	nodeVar173 = nodeVar172;
	nodeVar174 = ( vec3<f32>( nodeVar173 ) * nodeVar169 );
	nodeVar175 = ( vec3<f32>( 1.0 ) - nodeVar174 );
	nodeVar176 = nodeVar175;
	nodeVar177 = ( nodeVar170 / nodeVar176 );
	nodeVar178 = ( nodeVar177 * vec3<f32>( nodeVar173 ) );
	nodeVar179 = ( nodeVar161 + nodeVar178 );
	nodeVar161 = nodeVar179;
	nodeVar180 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar181 = ( irradiance * nodeVar180 );
	nodeVar182 = ( nodeVar160 + nodeVar161 );
	nodeVar183 = ( vec3<f32>( 1.0 ) - nodeVar182 );
	nodeVar184 = nodeVar183;
	nodeVar185 = ( nodeVar181 * nodeVar184 );
	nodeVar186 = nodeVar185;
	indirectDiffuse = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar187 = ( indirectDiffuse + nodeVar186 );
	indirectDiffuse = nodeVar187;
	singleScatteringDielectric = vec3<f32>( 0.0, 0.0, 0.0 );
	multiScatteringDielectric = vec3<f32>( 0.0, 0.0, 0.0 );
	singleScatteringMetallic = vec3<f32>( 0.0, 0.0, 0.0 );
	multiScatteringMetallic = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar188 = ( SpecularColor * vec3<f32>( dfg.x ) );
	nodeVar189 = ( SpecularF90 * dfg.y );
	nodeVar190 = ( nodeVar188 + vec3<f32>( nodeVar189 ) );
	nodeVar191 = ( singleScatteringDielectric + nodeVar190 );
	singleScatteringDielectric = nodeVar191;
	nodeVar192 = ( vec3<f32>( 1.0 ) - SpecularColor );
	nodeVar193 = nodeVar192;
	nodeVar194 = ( nodeVar193 * vec3<f32>( 0.047619 ) );
	nodeVar195 = ( SpecularColor + nodeVar194 );
	nodeVar196 = ( nodeVar190 * nodeVar195 );
	nodeVar197 = ( dfg.x + dfg.y );
	nodeVar198 = ( 1.0 - nodeVar197 );
	nodeVar199 = nodeVar198;
	nodeVar200 = ( vec3<f32>( nodeVar199 ) * nodeVar195 );
	nodeVar201 = ( vec3<f32>( 1.0 ) - nodeVar200 );
	nodeVar202 = nodeVar201;
	nodeVar203 = ( nodeVar196 / nodeVar202 );
	nodeVar204 = ( nodeVar203 * vec3<f32>( nodeVar199 ) );
	nodeVar205 = ( multiScatteringDielectric + nodeVar204 );
	multiScatteringDielectric = nodeVar205;
	nodeVar206 = ( DiffuseColor.xyz * vec3<f32>( dfg.x ) );
	nodeVar207 = ( SpecularF90 * dfg.y );
	nodeVar208 = ( nodeVar206 + vec3<f32>( nodeVar207 ) );
	nodeVar209 = ( singleScatteringMetallic + nodeVar208 );
	singleScatteringMetallic = nodeVar209;
	nodeVar210 = ( vec3<f32>( 1.0 ) - DiffuseColor.xyz );
	nodeVar211 = nodeVar210;
	nodeVar212 = ( nodeVar211 * vec3<f32>( 0.047619 ) );
	nodeVar213 = ( DiffuseColor.xyz + nodeVar212 );
	nodeVar214 = ( nodeVar208 * nodeVar213 );
	nodeVar215 = ( dfg.x + dfg.y );
	nodeVar216 = ( 1.0 - nodeVar215 );
	nodeVar217 = nodeVar216;
	nodeVar218 = ( vec3<f32>( nodeVar217 ) * nodeVar213 );
	nodeVar219 = ( vec3<f32>( 1.0 ) - nodeVar218 );
	nodeVar220 = nodeVar219;
	nodeVar221 = ( nodeVar214 / nodeVar220 );
	nodeVar222 = ( nodeVar221 * vec3<f32>( nodeVar217 ) );
	nodeVar223 = ( multiScatteringMetallic + nodeVar222 );
	multiScatteringMetallic = nodeVar223;
	radiance = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar224 = mix( singleScatteringDielectric, singleScatteringMetallic, Metalness );
	nodeVar225 = ( radiance * nodeVar224 );
	nodeVar226 = mix( multiScatteringDielectric, multiScatteringMetallic, Metalness );
	iblIrradiance = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar227 = ( iblIrradiance * vec3<f32>( 0.3183098861837907 ) );
	nodeVar228 = ( nodeVar226 * nodeVar227 );
	nodeVar229 = ( nodeVar225 + nodeVar228 );
	nodeVar230 = nodeVar229;
	nodeVar231 = ( singleScatteringDielectric + multiScatteringDielectric );
	nodeVar232 = ( vec3<f32>( 1.0 ) - nodeVar231 );
	nodeVar233 = nodeVar232;
	nodeVar234 = ( DiffuseContribution * nodeVar233 );
	nodeVar235 = ( nodeVar234 * nodeVar227 );
	nodeVar236 = nodeVar235;
	indirectSpecular = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar237 = ( indirectSpecular + nodeVar230 );
	indirectSpecular = nodeVar237;
	nodeVar238 = ( indirectDiffuse + nodeVar236 );
	indirectDiffuse = nodeVar238;
	ambientOcclusion = 1.0;
	nodeVar239 = ( indirectDiffuse * vec3<f32>( ambientOcclusion ) );
	indirectDiffuse = nodeVar239;
	nodeVar240 = dot( normalView, positionViewDirection );
	nodeVar241 = ( clamp( nodeVar240, 0.0, 1.0 ) + ambientOcclusion );
	nodeVar242 = ( Roughness * -16.0 );
	nodeVar243 = ( 1.0 - nodeVar242 );
	nodeVar244 = nodeVar243;
	nodeVar245 = ( - nodeVar244 );
	nodeVar246 = exp2( nodeVar245 );
	nodeVar247 = pow( nodeVar241, nodeVar246 );
	nodeVar248 = ( 1.0 - nodeVar247 );
	nodeVar249 = nodeVar248;
	nodeVar250 = ( ambientOcclusion - nodeVar249 );
	nodeVar251 = ( indirectSpecular * vec3<f32>( clamp( nodeVar250, 0.0, 1.0 ) ) );
	indirectSpecular = nodeVar251;
	nodeVar252 = ( directDiffuse + indirectDiffuse );
	totalDiffuse = nodeVar252;
	nodeVar253 = ( directSpecular + indirectSpecular );
	totalSpecular = nodeVar253;
	nodeVar254 = ( totalDiffuse + totalSpecular );
	outgoingLight = nodeVar254;
	Output = max( vec4<f32>( ( outgoingLight + EmissiveColor ), DiffuseColor.w ), vec4<f32>( 0.0 ) );
	nodeVar255 = ( - v_positionView.z );
	let nodeConst0 = max( ( 3.0 - v_positionWorld.y ), 0.0 );
	let nodeConst1 = ( nodeConst0 * ( - v_positionView.z ) );
	nodeVar256 = vec4<f32>( mix( Output.xyz, mix( object.nodeUniform44, object.nodeUniform45, pow( clamp( dot( normalize( ( v_positionWorld - render.cameraPosition ) ), object.nodeUniform46 ), 0.0, 1.0 ), 2.5 ) ), ( 1.0 - ( ( 1.0 - ( 1.0 - exp( ( - ( ( ( object.nodeUniform47 * object.nodeUniform47 ) * nodeVar255 ) * nodeVar255 ) ) ) ) ) * ( 1.0 - ( 1.0 - exp( ( - ( ( ( 0.0025 * 0.0025 ) * nodeConst1 ) * nodeConst1 ) ) ) ) ) ) ) ), Output.w );
	Output = nodeVar256;

	// result

	output.color = nodeVar256;

	return output;

}
