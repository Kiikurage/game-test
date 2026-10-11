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
@binding( 3 ) @group( 1 ) var nodeUniform6_sampler : sampler;
@binding( 4 ) @group( 1 ) var nodeUniform6 : texture_2d<f32>;
@binding( 5 ) @group( 1 ) var nodeUniform10_sampler : sampler;
@binding( 6 ) @group( 1 ) var nodeUniform10 : texture_2d<f32>;
@binding( 7 ) @group( 1 ) var nodeUniform18_sampler : sampler;
@binding( 8 ) @group( 1 ) var nodeUniform18 : texture_2d<f32>;
@binding( 9 ) @group( 1 ) var nodeUniform26_sampler : sampler;
@binding( 10 ) @group( 1 ) var nodeUniform26 : texture_2d<f32>;
@binding( 11 ) @group( 1 ) var nodeUniform39_sampler : sampler_comparison;
@binding( 12 ) @group( 1 ) var nodeUniform39 : texture_depth_2d;

struct objectStruct {
	nodeUniform0 : mat4x4<f32>,
	nodeUniform2 : mat4x4<f32>,
	nodeUniform4 : mat3x3<f32>,
	nodeUniform5 : mat4x4<f32>,
	nodeUniform7 : f32,
	nodeUniform8 : f32,
	nodeUniform9 : f32,
	nodeUniform11 : mat3x3<f32>,
	nodeUniform12 : f32,
	nodeUniform13 : mat3x3<f32>,
	nodeUniform15 : mat3x3<f32>,
	nodeUniform16 : f32,
	nodeUniform17 : vec3<f32>,
	nodeUniform19 : mat3x3<f32>,
	nodeUniform20 : vec2<f32>,
	nodeUniform23 : vec3<f32>,
	nodeUniform24 : vec3<f32>,
	nodeUniform25 : f32,
	nodeUniform47 : vec3<f32>,
	nodeUniform48 : vec3<f32>,
	nodeUniform49 : vec3<f32>,
	nodeUniform50 : f32
};
@binding( 2 ) @group( 1 )
var<uniform> object : objectStruct;

struct renderStruct {
	cameraProjectionMatrix : mat4x4<f32>,
	cameraViewMatrix : mat4x4<f32>,
	nodeUniform28 : vec3<f32>,
	nodeUniform29 : vec3<f32>,
	nodeUniform27 : vec3<f32>,
	nodeUniform32 : vec3<f32>,
	nodeUniform35 : vec3<f32>,
	nodeUniform44 : vec3<f32>,
	nodeUniform45 : f32,
	nodeUniform46 : f32,
	nodeUniform30 : vec3<f32>,
	nodeUniform31 : vec3<f32>,
	nodeUniform33 : vec3<f32>,
	nodeUniform34 : vec3<f32>,
	nodeUniform43 : vec3<f32>,
	nodeUniform36 : mat4x4<f32>,
	nodeUniform37 : f32,
	nodeUniform38 : f32,
	nodeUniform42 : f32,
	cameraPosition : vec3<f32>,
	nodeUniform40 : f32,
	nodeUniform41 : vec2<f32>
};
@binding( 0 ) @group( 0 )
var<uniform> render : renderStruct;

// vars
var<private> DiffuseColor : vec4<f32>;
var<private> nodeVar1 : vec4<f32>;
var<private> nodeVar2 : vec3<f32>;
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
var<private> nodeVar17 : vec4<f32>;
var<private> Roughness : f32;
var<private> nodeVar18 : vec4<f32>;
var<private> normalViewGeometry : vec3<f32>;
var<private> nodeVar19 : vec3<f32>;
var<private> SpecularColor : vec3<f32>;
var<private> SpecularColorBlended : vec3<f32>;
var<private> SpecularF90 : f32;
var<private> DiffuseContribution : vec3<f32>;
var<private> EmissiveColor : vec3<f32>;
var<private> nodeVar20 : vec3<f32>;
var<private> nodeVar21 : f32;
var<private> nodeVar22 : f32;
var<private> nodeVar23 : vec2<f32>;
var<private> nodeVar24 : f32;
var<private> NORMAL_normalView : vec3<f32>;
var<private> nodeVar25 : vec3<f32>;
var<private> nodeVar26 : vec2<f32>;
var<private> nodeVar27 : vec3<f32>;
var<private> nodeVar28 : vec2<f32>;
var<private> nodeVar29 : vec3<f32>;
var<private> nodeVar30 : f32;
var<private> nodeVar31 : vec3<f32>;
var<private> nodeVar32 : f32;
var<private> tangentViewFrame : vec3<f32>;
var<private> NORMAL_tangentView : vec3<f32>;
var<private> bitangentViewFrame : vec3<f32>;
var<private> NORMAL_bitangentView : vec3<f32>;
var<private> NORMAL_TBNViewMatrix : mat3x3<f32>;
var<private> nodeVar33 : vec4<f32>;
var<private> nodeVar34 : vec4<f32>;
var<private> normalView : vec3<f32>;
var<private> normalWorld : vec3<f32>;
var<private> nodeVar35 : vec3<f32>;
var<private> nodeVar36 : vec3<f32>;
var<private> nodeVar37 : f32;
var<private> nodeVar38 : f32;
var<private> nodeVar39 : f32;
var<private> Output : vec4<f32>;
var<private> positionViewDirection : vec3<f32>;
var<private> nodeVar40 : f32;
var<private> nodeVar41 : vec2<f32>;
var<private> nodeVar42 : f32;
var<private> nodeVar43 : f32;
var<private> nodeVar44 : f32;
var<private> nodeVar45 : f32;
var<private> nodeVar46 : vec3<f32>;
var<private> nodeVar47 : vec3<f32>;
var<private> irradiance : vec3<f32>;
var<private> nodeVar48 : f32;
var<private> nodeVar49 : f32;
var<private> nodeVar50 : f32;
var<private> nodeVar51 : vec3<f32>;
var<private> nodeVar52 : vec3<f32>;
var<private> nodeVar53 : vec3<f32>;
var<private> nodeVar54 : vec4<f32>;
var<private> nodeVar55 : vec4<f32>;
var<private> nodeVar56 : vec3<f32>;
var<private> nodeVar57 : vec3<f32>;
var<private> nodeVar58 : f32;
var<private> nodeVar59 : vec3<f32>;
var<private> nodeVar60 : vec3<f32>;
var<private> directDiffuse : vec3<f32>;
var<private> nodeVar61 : vec3<f32>;
var<private> nodeVar62 : vec3<f32>;
var<private> nodeVar63 : vec3<f32>;
var<private> nodeVar64 : vec3<f32>;
var<private> nodeVar65 : f32;
var<private> nodeVar66 : f32;
var<private> nodeVar67 : f32;
var<private> nodeVar68 : vec3<f32>;
var<private> nodeVar69 : vec3<f32>;
var<private> nodeVar70 : vec3<f32>;
var<private> nodeVar71 : vec3<f32>;
var<private> nodeVar72 : vec3<f32>;
var<private> directSpecular : vec3<f32>;
var<private> nodeVar73 : vec3<f32>;
var<private> nodeVar74 : f32;
var<private> nodeVar75 : f32;
var<private> nodeVar76 : f32;
var<private> nodeVar77 : vec3<f32>;
var<private> nodeVar78 : vec3<f32>;
var<private> nodeVar79 : vec3<f32>;
var<private> nodeVar80 : vec3<f32>;
var<private> nodeVar81 : vec3<f32>;
var<private> nodeVar82 : vec4<f32>;
var<private> nodeVar83 : vec4<f32>;
var<private> nodeVar84 : vec3<f32>;
var<private> nodeVar85 : vec3<f32>;
var<private> nodeVar86 : f32;
var<private> shadowPositionWorld : vec3<f32>;
var<private> nodeVar87 : f32;
var<private> nodeVar88 : vec4<f32>;
var<private> nodeVar89 : vec3<f32>;
var<private> nodeVar90 : vec3<f32>;
var<private> nodeVar91 : f32;
var<private> nodeVar92 : f32;
var<private> nodeVar93 : vec2<f32>;
var<private> nodeVar94 : f32;
var<private> nodeVar95 : vec2<f32>;
var<private> nodeVar96 : f32;
var<private> nodeVar97 : vec2<f32>;
var<private> nodeVar98 : f32;
var<private> nodeVar99 : vec2<f32>;
var<private> nodeVar100 : f32;
var<private> nodeVar101 : vec2<f32>;
var<private> nodeVar102 : f32;
var<private> nodeVar103 : f32;
var<private> nodeVar104 : vec3<f32>;
var<private> nodeVar105 : vec3<f32>;
var<private> nodeVar106 : vec3<f32>;
var<private> nodeVar107 : vec3<f32>;
var<private> nodeVar108 : vec3<f32>;
var<private> nodeVar109 : vec3<f32>;
var<private> nodeVar110 : f32;
var<private> nodeVar111 : f32;
var<private> nodeVar112 : f32;
var<private> nodeVar113 : vec3<f32>;
var<private> nodeVar114 : vec3<f32>;
var<private> nodeVar115 : vec3<f32>;
var<private> nodeVar116 : vec3<f32>;
var<private> nodeVar117 : vec3<f32>;
var<private> nodeVar118 : vec3<f32>;
var<private> nodeVar119 : f32;
var<private> nodeVar120 : f32;
var<private> nodeVar121 : f32;
var<private> nodeVar122 : vec3<f32>;
var<private> nodeVar123 : vec3<f32>;
var<private> nodeVar124 : vec3<f32>;
var<private> nodeVar125 : vec3<f32>;
var<private> nodeVar126 : vec3<f32>;
var<private> nodeVar127 : vec3<f32>;
var<private> nodeVar128 : f32;
var<private> nodeVar129 : f32;
var<private> nodeVar130 : f32;
var<private> nodeVar131 : f32;
var<private> nodeVar132 : f32;
var<private> nodeVar133 : vec3<f32>;
var<private> nodeVar134 : vec3<f32>;
var<private> nodeVar135 : vec3<f32>;
var<private> nodeVar136 : vec3<f32>;
var<private> nodeVar137 : vec3<f32>;
var<private> nodeVar138 : vec3<f32>;
var<private> nodeVar139 : vec3<f32>;
var<private> nodeVar140 : f32;
var<private> nodeVar141 : f32;
var<private> nodeVar142 : f32;
var<private> nodeVar143 : vec3<f32>;
var<private> nodeVar144 : vec3<f32>;
var<private> nodeVar145 : vec3<f32>;
var<private> nodeVar146 : vec3<f32>;
var<private> nodeVar147 : vec3<f32>;
var<private> nodeVar148 : vec3<f32>;
var<private> nodeVar149 : f32;
var<private> nodeVar150 : f32;
var<private> nodeVar151 : f32;
var<private> nodeVar152 : vec3<f32>;
var<private> nodeVar153 : vec3<f32>;
var<private> nodeVar154 : vec3<f32>;
var<private> nodeVar155 : vec3<f32>;
var<private> nodeVar156 : vec3<f32>;
var<private> nodeVar157 : vec3<f32>;
var<private> nodeVar158 : vec3<f32>;
var<private> nodeVar159 : f32;
var<private> nodeVar160 : vec3<f32>;
var<private> nodeVar161 : vec3<f32>;
var<private> nodeVar162 : vec3<f32>;
var<private> nodeVar163 : vec3<f32>;
var<private> nodeVar164 : vec3<f32>;
var<private> nodeVar165 : vec3<f32>;
var<private> nodeVar166 : vec3<f32>;
var<private> nodeVar167 : f32;
var<private> nodeVar168 : f32;
var<private> nodeVar169 : f32;
var<private> nodeVar170 : vec3<f32>;
var<private> nodeVar171 : vec3<f32>;
var<private> nodeVar172 : vec3<f32>;
var<private> nodeVar173 : vec3<f32>;
var<private> nodeVar174 : vec3<f32>;
var<private> nodeVar175 : vec3<f32>;
var<private> nodeVar176 : vec3<f32>;
var<private> nodeVar177 : vec3<f32>;
var<private> nodeVar178 : vec3<f32>;
var<private> nodeVar179 : vec3<f32>;
var<private> nodeVar180 : vec3<f32>;
var<private> nodeVar181 : vec3<f32>;
var<private> nodeVar182 : vec3<f32>;
var<private> indirectDiffuse : vec3<f32>;
var<private> nodeVar183 : vec3<f32>;
var<private> singleScatteringDielectric : vec3<f32>;
var<private> multiScatteringDielectric : vec3<f32>;
var<private> singleScatteringMetallic : vec3<f32>;
var<private> multiScatteringMetallic : vec3<f32>;
var<private> nodeVar184 : vec3<f32>;
var<private> nodeVar185 : f32;
var<private> nodeVar186 : vec3<f32>;
var<private> nodeVar187 : vec3<f32>;
var<private> nodeVar188 : vec3<f32>;
var<private> nodeVar189 : vec3<f32>;
var<private> nodeVar190 : vec3<f32>;
var<private> nodeVar191 : vec3<f32>;
var<private> nodeVar192 : vec3<f32>;
var<private> nodeVar193 : f32;
var<private> nodeVar194 : f32;
var<private> nodeVar195 : f32;
var<private> nodeVar196 : vec3<f32>;
var<private> nodeVar197 : vec3<f32>;
var<private> nodeVar198 : vec3<f32>;
var<private> nodeVar199 : vec3<f32>;
var<private> nodeVar200 : vec3<f32>;
var<private> nodeVar201 : vec3<f32>;
var<private> nodeVar202 : vec3<f32>;
var<private> nodeVar203 : f32;
var<private> nodeVar204 : vec3<f32>;
var<private> nodeVar205 : vec3<f32>;
var<private> nodeVar206 : vec3<f32>;
var<private> nodeVar207 : vec3<f32>;
var<private> nodeVar208 : vec3<f32>;
var<private> nodeVar209 : vec3<f32>;
var<private> nodeVar210 : vec3<f32>;
var<private> nodeVar211 : f32;
var<private> nodeVar212 : f32;
var<private> nodeVar213 : f32;
var<private> nodeVar214 : vec3<f32>;
var<private> nodeVar215 : vec3<f32>;
var<private> nodeVar216 : vec3<f32>;
var<private> nodeVar217 : vec3<f32>;
var<private> nodeVar218 : vec3<f32>;
var<private> nodeVar219 : vec3<f32>;
var<private> radiance : vec3<f32>;
var<private> nodeVar220 : vec3<f32>;
var<private> nodeVar221 : vec3<f32>;
var<private> nodeVar222 : vec3<f32>;
var<private> iblIrradiance : vec3<f32>;
var<private> nodeVar223 : vec3<f32>;
var<private> nodeVar224 : vec3<f32>;
var<private> nodeVar225 : vec3<f32>;
var<private> nodeVar226 : vec3<f32>;
var<private> nodeVar227 : vec3<f32>;
var<private> nodeVar228 : vec3<f32>;
var<private> nodeVar229 : vec3<f32>;
var<private> nodeVar230 : vec3<f32>;
var<private> nodeVar231 : vec3<f32>;
var<private> nodeVar232 : vec3<f32>;
var<private> indirectSpecular : vec3<f32>;
var<private> nodeVar233 : vec3<f32>;
var<private> nodeVar234 : vec3<f32>;
var<private> ambientOcclusion : f32;
var<private> nodeVar235 : vec3<f32>;
var<private> nodeVar236 : f32;
var<private> nodeVar237 : f32;
var<private> nodeVar238 : f32;
var<private> nodeVar239 : f32;
var<private> nodeVar240 : f32;
var<private> nodeVar241 : f32;
var<private> nodeVar242 : f32;
var<private> nodeVar243 : f32;
var<private> nodeVar244 : f32;
var<private> nodeVar245 : f32;
var<private> nodeVar246 : f32;
var<private> nodeVar247 : vec3<f32>;
var<private> totalDiffuse : vec3<f32>;
var<private> nodeVar248 : vec3<f32>;
var<private> totalSpecular : vec3<f32>;
var<private> nodeVar249 : vec3<f32>;
var<private> outgoingLight : vec3<f32>;
var<private> nodeVar250 : vec3<f32>;
var<private> nodeVar251 : f32;
var<private> nodeVar252 : vec4<f32>;

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
	nodeVar2 = ( nodeVar1.xyz * vec3<f32>( 0.78, 0.85, 1.0 ) );
	nodeVar3 = fract( ( vec3<f32>( ( nodeVarying7 * vec2<f32>( 14.0 ) ), 0.37 ) / vec3<f32>( 8.0 ) ) );
	nodeVar4 = ( nodeVar3.z * 64.0 );
	nodeVar5 = floor( nodeVar4 );
	nodeVar6 = textureSample( nodeUniform6, nodeUniform6_sampler, ( ( ( ( vec2<f32>( tsl_mod_float( nodeVar5, 8.0 ), floor( ( nodeVar5 / 8.0 ) ) ) * vec2<f32>( 66.0 ) ) + ( nodeVar3.xy * vec2<f32>( 64.0 ) ) ) + vec2<f32>( 1.5 ) ) / vec2<f32>( 528.0 ) ) ).xy;
	nodeVar7 = mix( -0.11, 1.01, object.nodeUniform7 );
	nodeVar8 = fract( ( ( v_positionWorld * vec3<f32>( 4.2 ) ) / vec3<f32>( 8.0 ) ) );
	nodeVar9 = ( nodeVar8.z * 64.0 );
	nodeVar10 = floor( nodeVar9 );
	nodeVar11 = textureSample( nodeUniform6, nodeUniform6_sampler, ( ( ( ( vec2<f32>( tsl_mod_float( nodeVar10, 8.0 ), floor( ( nodeVar10 / 8.0 ) ) ) * vec2<f32>( 66.0 ) ) + ( nodeVar8.xy * vec2<f32>( 64.0 ) ) ) + vec2<f32>( 1.5 ) ) / vec2<f32>( 528.0 ) ) ).xy;
	nodeVar12 = clamp( ( ( mix( nodeVar11.x, nodeVar11.y, ( nodeVar9 - nodeVar10 ) ) * 0.9 ) + 0.5 ), 0.0, 1.0 );
	nodeVar13 = ( 1.0 - smoothstep( nodeVar7, ( nodeVar7 + 0.1 ), nodeVar12 ) );
	nodeVar14 = ( nodeVar13 * nodeVar13 );
	nodeVar15 = mix( ( ( ( ( mix( vec3<f32>( dot( nodeVar2, vec3<f32>( 0.2126, 0.7152, 0.0722 ) ) ), nodeVar2, 0.35 ) * vec3<f32>( 0.06847816983662762, 0.0722718506743852, 0.05126945836711539 ) ) * vec3<f32>( 7.0 ) ) * vec3<f32>( ( ( smoothstep( 0.0, 1.1, v_positionWorld.y ) * 0.45 ) + 0.55 ) ) ) * vec3<f32>( ( ( smoothstep( -0.2, 0.5, mix( nodeVar6.x, nodeVar6.y, ( nodeVar4 - nodeVar5 ) ) ) * 0.35 ) + 0.65 ) ) ), vec3<f32>( 0.007499032040460618, 0.005605391621829108, 0.004776953478513362 ), ( nodeVar14 * 0.9 ) );
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
	nodeVar17 = textureSample( nodeUniform10, nodeUniform10_sampler, ( object.nodeUniform11 * vec3<f32>( nodeVarying7, 1.0 ) ).xy );
	Metalness = ( object.nodeUniform9 * nodeVar17.z );
	nodeVar18 = textureSample( nodeUniform10, nodeUniform10_sampler, ( object.nodeUniform13 * vec3<f32>( nodeVarying7, 1.0 ) ).xy );
	normalViewGeometry = normalize( v_normalViewGeometry );
	nodeVar19 = max( abs( dpdx( normalViewGeometry ) ), abs( - dpdy( normalViewGeometry ) ) );
	Roughness = min( ( max( ( object.nodeUniform12 * nodeVar18.y ), 0.0525 ) + max( max( nodeVar19.x, nodeVar19.y ), nodeVar19.z ) ), 1.0 );
	SpecularColor = vec3<f32>( 0.04, 0.04, 0.04 );
	SpecularColorBlended = mix( vec3<f32>( 0.04, 0.04, 0.04 ), DiffuseColor.xyz, Metalness );
	SpecularF90 = 1.0;
	DiffuseContribution = ( DiffuseColor.xyz * vec3<f32>( ( 1.0 - ( object.nodeUniform9 * nodeVar17.z ) ) ) );
	nodeVar20 = fract( ( vec3<f32>( ( nodeVarying7 * vec2<f32>( 30.0 ) ), 0.37 ) / vec3<f32>( 8.0 ) ) );
	nodeVar21 = ( nodeVar20.z * 64.0 );
	nodeVar22 = floor( nodeVar21 );
	nodeVar23 = textureSample( nodeUniform6, nodeUniform6_sampler, ( ( ( ( vec2<f32>( tsl_mod_float( nodeVar22, 8.0 ), floor( ( nodeVar22 / 8.0 ) ) ) * vec2<f32>( 66.0 ) ) + ( nodeVar20.xy * vec2<f32>( 64.0 ) ) ) + vec2<f32>( 1.5 ) ) / vec2<f32>( 528.0 ) ) ).xy;

	if ( ( object.nodeUniform7 > 0.0 ) ) {

		nodeVar24 = 3.2;

	} else {

		nodeVar24 = 0.0;

	}

	NORMAL_normalView = normalViewGeometry;
	nodeVar25 = cross( - dpdy( v_positionView ), NORMAL_normalView );
	nodeVar26 = dpdx( nodeVarying7 );
	nodeVar27 = cross( NORMAL_normalView, dpdx( v_positionView ) );
	nodeVar28 = - dpdy( nodeVarying7 );
	nodeVar29 = ( ( nodeVar25 * vec3<f32>( nodeVar26.x ) ) + ( nodeVar27 * vec3<f32>( nodeVar28.x ) ) );
	nodeVar31 = ( ( nodeVar25 * vec3<f32>( nodeVar26.y ) ) + ( nodeVar27 * vec3<f32>( nodeVar28.y ) ) );
	nodeVar32 = max( dot( nodeVar29, nodeVar29 ), dot( nodeVar31, nodeVar31 ) );

	if ( ( nodeVar32 == 0.0 ) ) {

		nodeVar30 = 0.0;

	} else {

		nodeVar30 = inverseSqrt( nodeVar32 );

	}

	tangentViewFrame = ( nodeVar29 * vec3<f32>( nodeVar30 ) );
	NORMAL_tangentView = tangentViewFrame;
	bitangentViewFrame = ( nodeVar31 * nodeVar30 );
	NORMAL_bitangentView = bitangentViewFrame;
	NORMAL_TBNViewMatrix = mat3x3<f32>( NORMAL_tangentView, NORMAL_bitangentView, NORMAL_normalView );
	nodeVar33 = textureSample( nodeUniform18, nodeUniform18_sampler, ( object.nodeUniform19 * vec3<f32>( nodeVarying7, 1.0 ) ).xy );
	nodeVar34 = ( ( nodeVar33 * vec4<f32>( 2.0 ) ) - vec4<f32>( 1.0 ) );
	normalView = normalize( ( NORMAL_TBNViewMatrix * vec3<f32>( ( nodeVar34.xy * object.nodeUniform20 ), nodeVar34.z ) ) );
	normalWorld = normalize( ( vec4<f32>( normalView, 0.0 ) * render.cameraViewMatrix ).xyz );
	nodeVar35 = normalize( normalWorld );
	nodeVar36 = normalize( ( render.cameraPosition - v_positionWorld ) );
	nodeVar37 = pow( ( 1.0 - clamp( dot( nodeVar35, nodeVar36 ), 0.0, 1.0 ) ), 3.0 );
	nodeVar38 = smoothstep( -0.35, 0.55, dot( nodeVar35, object.nodeUniform23 ) );
	nodeVar39 = smoothstep( -0.15, 0.85, ( - dot( nodeVar36, object.nodeUniform23 ) ) );
	EmissiveColor = ( ( ( ( ( vec3<f32>( 1.0, 0.10224173307914941, 0.0069954101845983935 ) * vec3<f32>( object.nodeUniform16 ) ) * vec3<f32>( ( 1.0 - smoothstep( 0.0, 0.035, abs( mix( nodeVar23.x, nodeVar23.y, ( nodeVar21 - nodeVar22 ) ) ) ) ) ) ) * vec3<f32>( 0.9 ) ) + ( ( vec3<f32>( 1.0, 0.10224173307914941, 0.0069954101845983935 ) * vec3<f32>( smoothstep( 0.35, 1.0, nodeVar13 ) ) ) * vec3<f32>( nodeVar24 ) ) ) + ( mix( vec3<f32>( 0.0, 0.0, 0.0 ), ( ( ( ( ( object.nodeUniform17 * vec3<f32>( nodeVar37 ) ) * vec3<f32>( nodeVar38 ) ) * vec3<f32>( ( ( nodeVar39 * 1.38 ) + 0.12 ) ) ) + ( ( ( object.nodeUniform24 * vec3<f32>( nodeVar37 ) ) * vec3<f32>( ( 1.0 - ( nodeVar38 * nodeVar39 ) ) ) ) * vec3<f32>( 0.18 ) ) ) + ( ( ( nodeVar15 * vec3<f32>( 0.07 ) ) * vec3<f32>( ( 1.0 - ( smoothstep( 0.0, 0.5, dot( nodeVar15, vec3<f32>( 0.299, 0.587, 0.114 ) ) ) * 0.6 ) ) ) ) + vec3<f32>( 0.006, 0.0055, 0.005 ) ) ), object.nodeUniform25 ) * vec3<f32>( ( 1.0 - nodeVar14 ) ) ) );
	positionViewDirection = normalize( v_positionViewDirection );
	nodeVar40 = dot( normalView, positionViewDirection );
	nodeVar41 = textureSample( nodeUniform26, nodeUniform26_sampler, vec2<f32>( Roughness, clamp( nodeVar40, 0.0, 1.0 ) ) ).xy;
	let dfg = nodeVar41;
	nodeVar42 = ( dfg.x + dfg.y );
	nodeVar43 = ( 1.0 / nodeVar42 );
	nodeVar44 = nodeVar43;
	nodeVar45 = ( nodeVar44 - 1.0 );
	nodeVar46 = ( SpecularColorBlended * vec3<f32>( nodeVar45 ) );
	nodeVar47 = ( nodeVar46 + vec3<f32>( 1.0 ) );
	let multiScatteringCompensation = nodeVar47;
	irradiance = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar48 = dot( normalWorld, normalize( render.nodeUniform29 ) );
	nodeVar49 = ( nodeVar48 * 0.5 );
	nodeVar50 = ( nodeVar49 + 0.5 );
	nodeVar51 = mix( render.nodeUniform27, render.nodeUniform28, nodeVar50 );
	nodeVar52 = ( irradiance + nodeVar51 );
	irradiance = nodeVar52;
	nodeVar53 = ( render.nodeUniform30 - render.nodeUniform31 );
	nodeVar54 = vec4<f32>( nodeVar53, 0.0 );
	nodeVar55 = ( render.cameraViewMatrix * nodeVar54 );
	nodeVar56 = normalize( nodeVar55.xyz );
	nodeVar57 = nodeVar56;
	nodeVar58 = dot( normalView, nodeVar57 );
	nodeVar59 = ( vec3<f32>( clamp( nodeVar58, 0.0, 1.0 ) ) * render.nodeUniform32 );
	nodeVar60 = nodeVar59;
	directDiffuse = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar61 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar62 = ( nodeVar60 * nodeVar61 );
	nodeVar63 = ( nodeVar57 + positionViewDirection );
	nodeVar64 = normalize( nodeVar63 );
	nodeVar65 = dot( positionViewDirection, nodeVar64 );
	nodeVar66 = clamp( nodeVar65, 0.0, 1.0 );
	nodeVar67 = exp2( ( ( ( nodeVar66 * -5.55473 ) - 6.98316 ) * nodeVar66 ) );
	nodeVar68 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar67 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar67 ) ) );
	nodeVar69 = ( vec3<f32>( 1.0 ) - nodeVar68 );
	nodeVar70 = nodeVar69;
	nodeVar71 = ( nodeVar62 * nodeVar70 );
	nodeVar72 = ( directDiffuse + nodeVar71 );
	directDiffuse = nodeVar72;
	directSpecular = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar73 = normalize( ( nodeVar57 + positionViewDirection ) );
	nodeVar74 = clamp( dot( positionViewDirection, nodeVar73 ), 0.0, 1.0 );
	nodeVar75 = exp2( ( ( ( nodeVar74 * -5.55473 ) - 6.98316 ) * nodeVar74 ) );
	nodeVar76 = ( Roughness * Roughness );
	nodeVar77 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar75 ) ) ) + vec3<f32>( ( 1.0 * nodeVar75 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar76, clamp( dot( normalView, nodeVar57 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar76, clamp( dot( normalView, nodeVar73 ), 0.0, 1.0 ) ) ) );
	nodeVar78 = ( nodeVar60 * nodeVar77 );
	nodeVar79 = ( nodeVar78 * multiScatteringCompensation );
	nodeVar80 = ( directSpecular + nodeVar79 );
	directSpecular = nodeVar80;
	nodeVar81 = ( render.nodeUniform33 - render.nodeUniform34 );
	nodeVar82 = vec4<f32>( nodeVar81, 0.0 );
	nodeVar83 = ( render.cameraViewMatrix * nodeVar82 );
	nodeVar84 = normalize( nodeVar83.xyz );
	nodeVar85 = nodeVar84;
	nodeVar86 = dot( normalView, nodeVar85 );
	shadowPositionWorld = v_positionWorld;
	nodeVar88 = ( render.nodeUniform36 * vec4<f32>( ( shadowPositionWorld + ( normalWorld * vec3<f32>( render.nodeUniform37 ) ) ), 1.0 ) );
	nodeVar89 = ( nodeVar88.xyz / vec3<f32>( nodeVar88.w ) );
	nodeVar90 = vec3<f32>( nodeVar89.x, ( 1.0 - nodeVar89.y ), ( nodeVar89.z + render.nodeUniform38 ) );

	if ( ( ( ( ( ( nodeVar90.x >= 0.0 ) && ( nodeVar90.x <= 1.0 ) ) && ( nodeVar90.y >= 0.0 ) ) && ( nodeVar90.y <= 1.0 ) ) && ( nodeVar90.z <= 1.0 ) ) ) {

		nodeVar91 = ( interleavedGradientNoise( fragCoord.xy ) * 6.28318530718 );
		nodeVar92 = ( render.nodeUniform40 * ( vec2<f32>( 1.0, 1.0 ) / render.nodeUniform41 ).x );
		nodeVar93 = ( nodeVar90.xy + ( vogelDiskSample( 0, 5, nodeVar91 ) * vec2<f32>( nodeVar92 ) ) );
		nodeVar94 = textureSampleCompare( nodeUniform39, nodeUniform39_sampler, nodeVar93, nodeVar90.z );
		nodeVar95 = ( nodeVar90.xy + ( vogelDiskSample( 1, 5, nodeVar91 ) * vec2<f32>( nodeVar92 ) ) );
		nodeVar96 = textureSampleCompare( nodeUniform39, nodeUniform39_sampler, nodeVar95, nodeVar90.z );
		nodeVar97 = ( nodeVar90.xy + ( vogelDiskSample( 2, 5, nodeVar91 ) * vec2<f32>( nodeVar92 ) ) );
		nodeVar98 = textureSampleCompare( nodeUniform39, nodeUniform39_sampler, nodeVar97, nodeVar90.z );
		nodeVar99 = ( nodeVar90.xy + ( vogelDiskSample( 3, 5, nodeVar91 ) * vec2<f32>( nodeVar92 ) ) );
		nodeVar100 = textureSampleCompare( nodeUniform39, nodeUniform39_sampler, nodeVar99, nodeVar90.z );
		nodeVar101 = ( nodeVar90.xy + ( vogelDiskSample( 4, 5, nodeVar91 ) * vec2<f32>( nodeVar92 ) ) );
		nodeVar102 = textureSampleCompare( nodeUniform39, nodeUniform39_sampler, nodeVar101, nodeVar90.z );
		nodeVar87 = ( ( ( ( ( nodeVar94 + nodeVar96 ) + nodeVar98 ) + nodeVar100 ) + nodeVar102 ) * 0.2 );

	} else {

		nodeVar87 = 1.0;

	}

	nodeVar103 = mix( 1.0, nodeVar87, render.nodeUniform42 );
	nodeVar104 = ( vec3<f32>( clamp( nodeVar86, 0.0, 1.0 ) ) * ( render.nodeUniform35 * vec3<f32>( nodeVar103 ) ) );
	nodeVar105 = nodeVar104;
	nodeVar106 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar107 = ( nodeVar105 * nodeVar106 );
	nodeVar108 = ( nodeVar85 + positionViewDirection );
	nodeVar109 = normalize( nodeVar108 );
	nodeVar110 = dot( positionViewDirection, nodeVar109 );
	nodeVar111 = clamp( nodeVar110, 0.0, 1.0 );
	nodeVar112 = exp2( ( ( ( nodeVar111 * -5.55473 ) - 6.98316 ) * nodeVar111 ) );
	nodeVar113 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar112 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar112 ) ) );
	nodeVar114 = ( vec3<f32>( 1.0 ) - nodeVar113 );
	nodeVar115 = nodeVar114;
	nodeVar116 = ( nodeVar107 * nodeVar115 );
	nodeVar117 = ( directDiffuse + nodeVar116 );
	directDiffuse = nodeVar117;
	nodeVar118 = normalize( ( nodeVar85 + positionViewDirection ) );
	nodeVar119 = clamp( dot( positionViewDirection, nodeVar118 ), 0.0, 1.0 );
	nodeVar120 = exp2( ( ( ( nodeVar119 * -5.55473 ) - 6.98316 ) * nodeVar119 ) );
	nodeVar121 = ( Roughness * Roughness );
	nodeVar122 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar120 ) ) ) + vec3<f32>( ( 1.0 * nodeVar120 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar121, clamp( dot( normalView, nodeVar85 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar121, clamp( dot( normalView, nodeVar118 ), 0.0, 1.0 ) ) ) );
	nodeVar123 = ( nodeVar105 * nodeVar122 );
	nodeVar124 = ( nodeVar123 * multiScatteringCompensation );
	nodeVar125 = ( directSpecular + nodeVar124 );
	directSpecular = nodeVar125;
	nodeVar126 = ( render.nodeUniform43 - v_positionView );
	nodeVar127 = normalize( nodeVar126 );
	nodeVar128 = dot( normalView, nodeVar127 );

	if ( ( render.nodeUniform45 > 0.0 ) ) {

		nodeVar130 = length( nodeVar126 );
		nodeVar131 = ( nodeVar130 / render.nodeUniform45 );
		nodeVar132 = clamp( ( 1.0 - ( ( ( nodeVar131 * nodeVar131 ) * nodeVar131 ) * nodeVar131 ) ), 0.0, 1.0 );
		nodeVar129 = ( ( 1.0 / max( pow( nodeVar130, render.nodeUniform46 ), 0.01 ) ) * ( nodeVar132 * nodeVar132 ) );

	} else {

		nodeVar129 = ( 1.0 / max( pow( length( nodeVar126 ), render.nodeUniform46 ), 0.01 ) );

	}

	nodeVar133 = ( render.nodeUniform44 * vec3<f32>( nodeVar129 ) );
	nodeVar134 = ( vec3<f32>( clamp( nodeVar128, 0.0, 1.0 ) ) * nodeVar133 );
	nodeVar135 = nodeVar134;
	nodeVar136 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar137 = ( nodeVar135 * nodeVar136 );
	nodeVar138 = ( nodeVar127 + positionViewDirection );
	nodeVar139 = normalize( nodeVar138 );
	nodeVar140 = dot( positionViewDirection, nodeVar139 );
	nodeVar141 = clamp( nodeVar140, 0.0, 1.0 );
	nodeVar142 = exp2( ( ( ( nodeVar141 * -5.55473 ) - 6.98316 ) * nodeVar141 ) );
	nodeVar143 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar142 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar142 ) ) );
	nodeVar144 = ( vec3<f32>( 1.0 ) - nodeVar143 );
	nodeVar145 = nodeVar144;
	nodeVar146 = ( nodeVar137 * nodeVar145 );
	nodeVar147 = ( directDiffuse + nodeVar146 );
	directDiffuse = nodeVar147;
	nodeVar148 = normalize( ( nodeVar127 + positionViewDirection ) );
	nodeVar149 = clamp( dot( positionViewDirection, nodeVar148 ), 0.0, 1.0 );
	nodeVar150 = exp2( ( ( ( nodeVar149 * -5.55473 ) - 6.98316 ) * nodeVar149 ) );
	nodeVar151 = ( Roughness * Roughness );
	nodeVar152 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar150 ) ) ) + vec3<f32>( ( 1.0 * nodeVar150 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar151, clamp( dot( normalView, nodeVar127 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar151, clamp( dot( normalView, nodeVar148 ), 0.0, 1.0 ) ) ) );
	nodeVar153 = ( nodeVar135 * nodeVar152 );
	nodeVar154 = ( nodeVar153 * multiScatteringCompensation );
	nodeVar155 = ( directSpecular + nodeVar154 );
	directSpecular = nodeVar155;
	nodeVar156 = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar157 = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar158 = ( SpecularColor * vec3<f32>( dfg.x ) );
	nodeVar159 = ( SpecularF90 * dfg.y );
	nodeVar160 = ( nodeVar158 + vec3<f32>( nodeVar159 ) );
	nodeVar161 = ( nodeVar156 + nodeVar160 );
	nodeVar156 = nodeVar161;
	nodeVar162 = ( vec3<f32>( 1.0 ) - SpecularColor );
	nodeVar163 = nodeVar162;
	nodeVar164 = ( nodeVar163 * vec3<f32>( 0.047619 ) );
	nodeVar165 = ( SpecularColor + nodeVar164 );
	nodeVar166 = ( nodeVar160 * nodeVar165 );
	nodeVar167 = ( dfg.x + dfg.y );
	nodeVar168 = ( 1.0 - nodeVar167 );
	nodeVar169 = nodeVar168;
	nodeVar170 = ( vec3<f32>( nodeVar169 ) * nodeVar165 );
	nodeVar171 = ( vec3<f32>( 1.0 ) - nodeVar170 );
	nodeVar172 = nodeVar171;
	nodeVar173 = ( nodeVar166 / nodeVar172 );
	nodeVar174 = ( nodeVar173 * vec3<f32>( nodeVar169 ) );
	nodeVar175 = ( nodeVar157 + nodeVar174 );
	nodeVar157 = nodeVar175;
	nodeVar176 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar177 = ( irradiance * nodeVar176 );
	nodeVar178 = ( nodeVar156 + nodeVar157 );
	nodeVar179 = ( vec3<f32>( 1.0 ) - nodeVar178 );
	nodeVar180 = nodeVar179;
	nodeVar181 = ( nodeVar177 * nodeVar180 );
	nodeVar182 = nodeVar181;
	indirectDiffuse = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar183 = ( indirectDiffuse + nodeVar182 );
	indirectDiffuse = nodeVar183;
	singleScatteringDielectric = vec3<f32>( 0.0, 0.0, 0.0 );
	multiScatteringDielectric = vec3<f32>( 0.0, 0.0, 0.0 );
	singleScatteringMetallic = vec3<f32>( 0.0, 0.0, 0.0 );
	multiScatteringMetallic = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar184 = ( SpecularColor * vec3<f32>( dfg.x ) );
	nodeVar185 = ( SpecularF90 * dfg.y );
	nodeVar186 = ( nodeVar184 + vec3<f32>( nodeVar185 ) );
	nodeVar187 = ( singleScatteringDielectric + nodeVar186 );
	singleScatteringDielectric = nodeVar187;
	nodeVar188 = ( vec3<f32>( 1.0 ) - SpecularColor );
	nodeVar189 = nodeVar188;
	nodeVar190 = ( nodeVar189 * vec3<f32>( 0.047619 ) );
	nodeVar191 = ( SpecularColor + nodeVar190 );
	nodeVar192 = ( nodeVar186 * nodeVar191 );
	nodeVar193 = ( dfg.x + dfg.y );
	nodeVar194 = ( 1.0 - nodeVar193 );
	nodeVar195 = nodeVar194;
	nodeVar196 = ( vec3<f32>( nodeVar195 ) * nodeVar191 );
	nodeVar197 = ( vec3<f32>( 1.0 ) - nodeVar196 );
	nodeVar198 = nodeVar197;
	nodeVar199 = ( nodeVar192 / nodeVar198 );
	nodeVar200 = ( nodeVar199 * vec3<f32>( nodeVar195 ) );
	nodeVar201 = ( multiScatteringDielectric + nodeVar200 );
	multiScatteringDielectric = nodeVar201;
	nodeVar202 = ( DiffuseColor.xyz * vec3<f32>( dfg.x ) );
	nodeVar203 = ( SpecularF90 * dfg.y );
	nodeVar204 = ( nodeVar202 + vec3<f32>( nodeVar203 ) );
	nodeVar205 = ( singleScatteringMetallic + nodeVar204 );
	singleScatteringMetallic = nodeVar205;
	nodeVar206 = ( vec3<f32>( 1.0 ) - DiffuseColor.xyz );
	nodeVar207 = nodeVar206;
	nodeVar208 = ( nodeVar207 * vec3<f32>( 0.047619 ) );
	nodeVar209 = ( DiffuseColor.xyz + nodeVar208 );
	nodeVar210 = ( nodeVar204 * nodeVar209 );
	nodeVar211 = ( dfg.x + dfg.y );
	nodeVar212 = ( 1.0 - nodeVar211 );
	nodeVar213 = nodeVar212;
	nodeVar214 = ( vec3<f32>( nodeVar213 ) * nodeVar209 );
	nodeVar215 = ( vec3<f32>( 1.0 ) - nodeVar214 );
	nodeVar216 = nodeVar215;
	nodeVar217 = ( nodeVar210 / nodeVar216 );
	nodeVar218 = ( nodeVar217 * vec3<f32>( nodeVar213 ) );
	nodeVar219 = ( multiScatteringMetallic + nodeVar218 );
	multiScatteringMetallic = nodeVar219;
	radiance = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar220 = mix( singleScatteringDielectric, singleScatteringMetallic, Metalness );
	nodeVar221 = ( radiance * nodeVar220 );
	nodeVar222 = mix( multiScatteringDielectric, multiScatteringMetallic, Metalness );
	iblIrradiance = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar223 = ( iblIrradiance * vec3<f32>( 0.3183098861837907 ) );
	nodeVar224 = ( nodeVar222 * nodeVar223 );
	nodeVar225 = ( nodeVar221 + nodeVar224 );
	nodeVar226 = nodeVar225;
	nodeVar227 = ( singleScatteringDielectric + multiScatteringDielectric );
	nodeVar228 = ( vec3<f32>( 1.0 ) - nodeVar227 );
	nodeVar229 = nodeVar228;
	nodeVar230 = ( DiffuseContribution * nodeVar229 );
	nodeVar231 = ( nodeVar230 * nodeVar223 );
	nodeVar232 = nodeVar231;
	indirectSpecular = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar233 = ( indirectSpecular + nodeVar226 );
	indirectSpecular = nodeVar233;
	nodeVar234 = ( indirectDiffuse + nodeVar232 );
	indirectDiffuse = nodeVar234;
	ambientOcclusion = 1.0;
	nodeVar235 = ( indirectDiffuse * vec3<f32>( ambientOcclusion ) );
	indirectDiffuse = nodeVar235;
	nodeVar236 = dot( normalView, positionViewDirection );
	nodeVar237 = ( clamp( nodeVar236, 0.0, 1.0 ) + ambientOcclusion );
	nodeVar238 = ( Roughness * -16.0 );
	nodeVar239 = ( 1.0 - nodeVar238 );
	nodeVar240 = nodeVar239;
	nodeVar241 = ( - nodeVar240 );
	nodeVar242 = exp2( nodeVar241 );
	nodeVar243 = pow( nodeVar237, nodeVar242 );
	nodeVar244 = ( 1.0 - nodeVar243 );
	nodeVar245 = nodeVar244;
	nodeVar246 = ( ambientOcclusion - nodeVar245 );
	nodeVar247 = ( indirectSpecular * vec3<f32>( clamp( nodeVar246, 0.0, 1.0 ) ) );
	indirectSpecular = nodeVar247;
	nodeVar248 = ( directDiffuse + indirectDiffuse );
	totalDiffuse = nodeVar248;
	nodeVar249 = ( directSpecular + indirectSpecular );
	totalSpecular = nodeVar249;
	nodeVar250 = ( totalDiffuse + totalSpecular );
	outgoingLight = nodeVar250;
	Output = max( vec4<f32>( ( outgoingLight + EmissiveColor ), DiffuseColor.w ), vec4<f32>( 0.0 ) );
	nodeVar251 = ( - v_positionView.z );
	let nodeConst0 = max( ( 3.0 - v_positionWorld.y ), 0.0 );
	let nodeConst1 = ( nodeConst0 * ( - v_positionView.z ) );
	nodeVar252 = vec4<f32>( mix( Output.xyz, mix( object.nodeUniform47, object.nodeUniform48, pow( clamp( dot( normalize( ( v_positionWorld - render.cameraPosition ) ), object.nodeUniform49 ), 0.0, 1.0 ), 2.5 ) ), ( 1.0 - ( ( 1.0 - ( 1.0 - exp( ( - ( ( ( object.nodeUniform50 * object.nodeUniform50 ) * nodeVar251 ) * nodeVar251 ) ) ) ) ) * ( 1.0 - ( 1.0 - exp( ( - ( ( ( 0.0025 * 0.0025 ) * nodeConst1 ) * nodeConst1 ) ) ) ) ) ) ) ), Output.w );
	Output = nodeVar252;

	// result

	output.color = nodeVar252;

	return output;

}
